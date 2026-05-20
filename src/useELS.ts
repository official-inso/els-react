import * as React from "react";
import { ELSContext } from "./ELSProvider.js";
import type { ELSContextValue } from "./ELSProvider.js";

/**
 * Returns the ELS `client` and `queue` from the nearest {@link ELSProvider}.
 * Throws if no provider is present.
 *
 * @example
 * const { client } = useELS();
 * client.info("dashboard opened");
 */
export function useELS(): ELSContextValue {
  const ctx = React.useContext(ELSContext);
  if (!ctx) {
    throw new Error(
      "useELS: no ELSProvider found. Wrap your app in <ELSProvider>.",
    );
  }
  return ctx;
}
