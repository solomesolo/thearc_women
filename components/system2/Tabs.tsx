"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TabId = string;

type Tab = { id: TabId; label: string };

type TabsProps<T extends TabId> = {
  tabs: Tab[];
  activeId: T;
  onChange: (id: T) => void;
  children: (activeId: T) => React.ReactNode;
  className?: string;
};

export function Tabs<T extends TabId>({
  tabs,
  activeId,
  onChange,
  children,
  className = "",
}: TabsProps<T>) {
  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex flex-wrap gap-1 border-b border-black/10 pb-2"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeId === tab.id}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            onClick={() => onChange(tab.id as T)}
            className={`
              min-h-[44px] min-w-[44px] rounded-lg px-4 py-2 text-sm font-medium
              transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--text-primary)]/30 focus-visible:ring-offset-2
              ${activeId === tab.id
                ? "bg-black/8 text-[var(--text-primary)]"
                : "text-black/60 hover:bg-black/[0.04] hover:text-black/80"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${activeId}`}
        aria-labelledby={`tab-${activeId}`}
        className="mt-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children(activeId)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
