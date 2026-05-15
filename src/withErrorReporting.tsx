import * as React from "react";
import { ELSErrorBoundary } from "./ELSErrorBoundary.js";
import type { ELSErrorBoundaryProps } from "./ELSErrorBoundary.js";

export function withErrorReporting<P extends object>(
  Component: React.ComponentType<P>,
  boundaryProps?: Omit<ELSErrorBoundaryProps, "children">,
): React.FC<P> {
  const Wrapped: React.FC<P> = (props) => (
    <ELSErrorBoundary {...boundaryProps}>
      <Component {...props} />
    </ELSErrorBoundary>
  );
  Wrapped.displayName = `withErrorReporting(${
    Component.displayName ?? Component.name ?? "Component"
  })`;
  return Wrapped;
}
