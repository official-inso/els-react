import * as React from "react";
import type { ErrorEntry, WritableErrorEntry } from "@inso_web/els-client";
import { useELS } from "./useELS.js";

/**
 * Returns a stable `report(error, extra?)` callback that sends an error to ELS
 * (through the provider's queue when enabled). Use it for handled/caught errors.
 *
 * @example
 * const report = useErrorReporter();
 * try { await save(); } catch (e) { report(e, { url: "/save" }); }
 */
export function useErrorReporter() {
  const { client, queue } = useELS();

  return React.useCallback(
    (err: unknown, extra?: Partial<WritableErrorEntry>) => {
      const e = err as Error | undefined;
      const entry: WritableErrorEntry = {
        message: e?.message ?? String(err),
        stack: e?.stack,
        level: "error",
        ...extra,
      };
      // Browser-side: source/url are resolved by the client (location.href).
      if (queue) queue.enqueue(entry as ErrorEntry);
      else void client.sendError(entry as ErrorEntry);
    },
    [client, queue],
  );
}
