import * as React from "react";
import { ELSContext } from "./ELSProvider.js";
import type { ELSContextValue } from "./ELSProvider.js";

export function useELS(): ELSContextValue {
  const ctx = React.useContext(ELSContext);
  if (!ctx) {
    throw new Error(
      "useELS: ELSProvider не найден. Оберните приложение в <ELSProvider>.",
    );
  }
  return ctx;
}
