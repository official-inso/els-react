import * as React from "react";
import { ELSContext } from "./ELSProvider.js";

/** Props for {@link ELSErrorBoundary}. */
export interface ELSErrorBoundaryProps {
  /** Rendered when a child throws. A function receives the caught error. */
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  /** Called in addition to reporting, e.g. for custom logging. */
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children?: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary that reports render errors (with component stack) to ELS via
 * the surrounding {@link ELSProvider} and shows an optional `fallback`.
 *
 * @example
 * <ELSErrorBoundary fallback={<p>Something went wrong</p>}>
 *   <Dashboard />
 * </ELSErrorBoundary>
 */
export class ELSErrorBoundary extends React.Component<
  ELSErrorBoundaryProps,
  State
> {
  static contextType = ELSContext;
  declare context: React.ContextType<typeof ELSContext>;

  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    const ctx = this.context;
    if (!ctx) return;
    const entry = {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack ?? undefined,
      level: "error" as const,
    };
    if (ctx.queue) ctx.queue.enqueue(entry);
    else void ctx.client.sendError(entry);
  }

  render() {
    if (this.state.error) {
      const { fallback } = this.props;
      if (typeof fallback === "function") return fallback(this.state.error);
      return fallback ?? null;
    }
    return this.props.children;
  }
}
