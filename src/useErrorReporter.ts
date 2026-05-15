import * as React from "react";
import type { ErrorEntry } from "@inso_web/els-client";
import { useELS } from "./useELS.js";

export function useErrorReporter() {
  const { client, queue } = useELS();

  return React.useCallback(
    (err: unknown, extra?: Partial<ErrorEntry>) => {
      const e = err as Error | undefined;
      const entry: ErrorEntry = {
        message: e?.message ?? String(err),
        stack: e?.stack,
        url:
          typeof location !== "undefined" ? location.href : extra?.url ?? "",
        level: "error",
        source: "client",
        ...extra,
      };
      if (queue) queue.enqueue(entry);
      else void client.sendError(entry);
    },
    [client, queue],
  );
}
