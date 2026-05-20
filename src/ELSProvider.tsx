import * as React from "react";
import { ELSClient, ELSQueue } from "@inso_web/els-client";
import type { ELSConfig } from "@inso_web/els-client";

/** Value provided by {@link ELSProvider} and read via {@link useELS}. */
export interface ELSContextValue {
  /** The shared ELS client. */
  client: ELSClient;
  /** The batching queue, or `null` when `useQueue` is disabled. */
  queue: ELSQueue | null;
}

/** React context holding the ELS client/queue. Prefer the {@link useELS} hook. */
export const ELSContext = React.createContext<ELSContextValue | null>(null);

/** Props for {@link ELSProvider}. */
export interface ELSProviderProps {
  /** ELS client configuration (only `apiKey` + `appSlug` are required). */
  config: ELSConfig;
  /** Use a batching queue. Default: `true`. */
  useQueue?: boolean;
  /** Queue auto-flush interval, in ms. */
  flushIntervalMs?: number;
  /** Max entries buffered before an early flush. */
  maxBatchSize?: number;
  /** Auto-subscribe to `window.onerror` and `unhandledrejection`. Default: `true`. */
  captureGlobalErrors?: boolean;
  children?: React.ReactNode;
}

/**
 * Provides a single ELS client (and optional queue) to the React tree and, by
 * default, captures uncaught errors and unhandled promise rejections. Wrap your
 * app once near the root.
 *
 * @example
 * <ELSProvider config={{ apiKey: "els_live_…", appSlug: "web" }}>
 *   <App />
 * </ELSProvider>
 */
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
        stack: event.error?.stack,
        level: "error" as const,
      };
      if (value.queue) value.queue.enqueue(entry);
      else void value.client.sendError(entry);
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const entry = {
        message: String(reason?.message ?? reason ?? "unhandledrejection"),
        stack: reason?.stack,
        level: "error" as const,
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
