"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type TabId = "context" | "signals" | "history";

type Step = { id: string; label: string; body: string };
type TabContent = {
  items: { label: string; detail: string }[];
  whyItMatters: string;
};

type MappingStepsProps = {
  intro: string;
  steps: Step[];
  tabs: Record<TabId, TabContent>;
};

const TAB_IDS: TabId[] = ["context", "signals", "history"];

export function MappingSteps({ intro, steps, tabs }: MappingStepsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("context");
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const tab = tabs[activeTab];
  const showDetail = (i: number) => hoveredItem === i || expandedItem === i;

  return (
    <div className="grid grid-cols-12 gap-8 md:gap-12">
      <div className="col-span-12 md:col-span-6">
        <p className="content-reading-col text-base leading-relaxed text-black/70 md:text-lg">
          {intro}
        </p>
        <ol className="content-reading-col mt-6 space-y-4">
          {steps.map((step, i) => (
            <li key={step.id} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/8 text-xs font-medium text-[var(--text-primary)]">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-[var(--text-primary)]">{step.label}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-black/70">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="col-span-12 md:col-span-6">
        <div
          className="inline-flex rounded-lg border border-black/10 p-0.5"
          role="tablist"
          aria-label="What we map"
        >
          {TAB_IDS.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`mapping-panel-${id}`}
              id={`mapping-tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === id
                  ? "bg-[var(--background)] text-[var(--text-primary)] shadow-sm"
                  : "text-black/70 hover:text-[var(--text-primary)]"
              }`}
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            id={`mapping-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`mapping-tab-${activeTab}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-xl border border-black/10 bg-[var(--color-surface)]/30 p-4"
          >
            <ul className="space-y-2">
              {tab.items.map((item, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onMouseEnter={() => setHoveredItem(i)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => setExpandedItem(expandedItem === i ? null : i)}
                    className="group w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-black/5"
                  >
                    <span className="font-medium capitalize text-[var(--text-primary)]">
                      {item.label}
                    </span>
                    <AnimatePresence>
                      {showDetail(i) && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-1 overflow-hidden text-xs leading-relaxed text-black/70"
                        >
                          {item.detail}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-4 border-t border-black/5 pt-4 text-xs italic leading-relaxed text-black/70">
              Why it matters: {tab.whyItMatters}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
