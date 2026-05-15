import * as React from "react";
import { ELSClient, ELSQueue } from "@inso_web/els-client";
import type { ELSConfig } from "@inso_web/els-client";

export interface ELSContextValue {
  client: ELSClient;
  queue: ELSQueue | null;
}

export const ELSContext = React.createContext<ELSContextValue | null>(null);

export interface ELSProviderProps {
  config: ELSConfig;
  /** Включить очередь с батчингом. По умолчанию true. */
  useQueue?: boolean;
  /** Интервал авто‑флаша очереди в мс. */
  flushIntervalMs?: number;
  /** Максимальный размер батча. */
  maxBatchSize?: number;
  /** Авто‑подписка на window.onerror и unhandledrejection. По умолчанию true. */
  captureGlobalErrors?: boolean;
  children?: React.ReactNode;
}

export const ELSProvider: React.FC<ELSProviderProps> = ({
  config,
  useQueue = true,
  flushIntervalMs,
  maxBatchSize,
  captureGlobalErrors = true,
  children,
}) => {
  const value = React.useMemo<ELSContextValue>(() => {
    const client = new ELSClient(config);
    const queue = useQueue
      ? new ELSQueue(client, { flushIntervalMs, maxBatchSize })
      : null;
    return { client, queue };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!captureGlobalErrors || typeof window === "undefined") return;

    const onError = (event: ErrorEvent) => {
      const entry = {
        message: event.message || "window.onerror",
        url: typeof location !== "undefined" ? location.href : "",
        stack: event.error?.stack,
        level: "error" as const,
        source: "client" as const,
      };
      if (value.queue) value.queue.enqueue(entry);
      else void value.client.sendError(entry);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const entry = {
        message: String(reason?.message ?? reason ?? "unhandledrejection"),
        url: typeof location !== "undefined" ? location.href : "",
        stack: reason?.stack,
        level: "error" as const,
        source: "client" as const,
      };
      if (value.queue) value.queue.enqueue(entry);
      else void value.client.sendError(entry);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, [captureGlobalErrors, value]);

  React.useEffect(() => {
    return () => {
      value.queue?.stop();
    };
  }, [value]);

  return <ELSContext.Provider value={value}>{children}</ELSContext.Provider>;
};
