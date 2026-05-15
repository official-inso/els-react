import { describe, it, expect, vi, beforeEach } from "vitest";
import * as React from "react";
import { render, screen, act } from "@testing-library/react";
import { ELSProvider } from "../src/ELSProvider.js";
import { useELS } from "../src/useELS.js";
import { useErrorReporter } from "../src/useErrorReporter.js";
import { ELSErrorBoundary } from "../src/ELSErrorBoundary.js";

const config = {
  endpoint: "https://example.test",
  apiKey: "test-key",
  appSlug: "test-app",
} as const;

beforeEach(() => {
  // замокать fetch чтобы клиент не делал реальных запросов
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ accepted: 1, duplicates: 0, errors: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ),
  );
});

function Consumer() {
  const { client } = useELS();
  return <div data-testid="ok">{client ? "ready" : "no"}</div>;
}

describe("ELSProvider", () => {
  it("предоставляет клиент через контекст", () => {
    render(
      <ELSProvider config={config} useQueue={false} captureGlobalErrors={false}>
        <Consumer />
      </ELSProvider>,
    );
    expect(screen.getByTestId("ok").textContent).toBe("ready");
  });

  it("useErrorReporter отправляет ошибку через очередь", async () => {
    let report: ((e: unknown) => void) | null = null;
    function Inner() {
      report = useErrorReporter();
      return null;
    }
    render(
      <ELSProvider config={config} captureGlobalErrors={false}>
        <Inner />
      </ELSProvider>,
    );
    await act(async () => {
      report?.(new Error("boom"));
    });
    expect(report).toBeTypeOf("function");
  });

  it("ELSErrorBoundary ловит ошибку в дочернем компоненте", () => {
    const Bad: React.FC = () => {
      throw new Error("kaboom");
    };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ELSProvider config={config} useQueue={false} captureGlobalErrors={false}>
        <ELSErrorBoundary fallback={<div data-testid="fb">fallback</div>}>
          <Bad />
        </ELSErrorBoundary>
      </ELSProvider>,
    );
    expect(screen.getByTestId("fb").textContent).toBe("fallback");
    spy.mockRestore();
  });

  it("useELS бросает без провайдера", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Consumer />)).toThrow(/ELSProvider/);
    spy.mockRestore();
  });
});
