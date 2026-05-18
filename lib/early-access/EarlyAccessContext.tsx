"use client";

import { createContext, useCallback, useContext, useState } from "react";

type ModalMode = "apply" | "invite" | null;

type EarlyAccessContextValue = {
  mode: ModalMode;
  openApply: () => void;
  openInvite: () => void;
  close: () => void;
};

const EarlyAccessContext = createContext<EarlyAccessContextValue>({
  mode: null,
  openApply: () => {},
  openInvite: () => {},
  close: () => {},
});

export function EarlyAccessProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ModalMode>(null);

  const openApply = useCallback(() => setMode("apply"), []);
  const openInvite = useCallback(() => setMode("invite"), []);
  const close = useCallback(() => setMode(null), []);

  return (
    <EarlyAccessContext.Provider value={{ mode, openApply, openInvite, close }}>
      {children}
    </EarlyAccessContext.Provider>
  );
}

export function useEarlyAccessModal() {
  return useContext(EarlyAccessContext);
}
