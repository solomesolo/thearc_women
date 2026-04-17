"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { ComingSoonModal } from "@/components/ui/ComingSoonModal";

// Paths that are not yet live — clicks on links to these trigger the modal
const GATED_PATHS = [
  "/survey",
  "/knowledge",
  "/upload",
  "/blog",
  "/login",
];

type ComingSoonCtx = {
  open: () => void;
};

const Ctx = createContext<ComingSoonCtx>({ open: () => {} });

export function useComingSoon() {
  return useContext(Ctx);
}

export function ComingSoonProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const lang = pathname.startsWith("/de") ? "de" : "en";

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);

  // Global click interceptor — catches <Link> and <a> clicks pointing at gated paths
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const anchor = (e.target as Element).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Normalise: strip trailing slash and /de prefix for comparison
      const stripped = href.replace(/^\/de/, "").replace(/\/$/, "") || "/";

      if (GATED_PATHS.some((p) => stripped === p || stripped.startsWith(p + "/"))) {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(true);
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  return (
    <Ctx.Provider value={{ open: openModal }}>
      {children}
      <ComingSoonModal open={isOpen} lang={lang} onClose={closeModal} />
    </Ctx.Provider>
  );
}
