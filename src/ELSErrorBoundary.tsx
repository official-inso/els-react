import * as React from "react";
import { ELSContext } from "./ELSProvider.js";

export interface ELSErrorBoundaryProps {
  fallback?: React.ReactNode | ((error: Error) => React.ReactNode);
  onError?: (error: Error, info: React.ErrorInfo) => void;
  children?: React.ReactNode;
}

interface State {
  error: Error | null;
}

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
      url: typeof location !== "undefined" ? location.href : "",
      level: "error" as const,
      source: "client" as const,
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
