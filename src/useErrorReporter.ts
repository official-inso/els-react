import * as React from "react";
import type { ErrorEntry } from "@inso_web/els-client";
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
    (err: unknown, extra?: Partial<ErrorEntry>) => {
      const e = err as Error | undefined;
      const entry: ErrorEntry = {
        message: e?.message ?? String(err),
        stack: e?.stack,
        level: "error",
        ...extra,
      };
      if (queue) queue.enqueue(entry);
      else void client.sendError(entry);
    },
    [client, queue],
  );
}
