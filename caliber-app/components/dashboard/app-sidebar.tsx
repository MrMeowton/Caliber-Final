"use client";

import { useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";
import type { Section } from "@/app/page";

interface AppSidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

// Today first, then the three steps of the deck: Monitor → Forecast → Act.
const mainMenu: Array<{ id: Section; label: string; question: string; step?: number }> = [
  { id: "today", label: "Today", question: "What must I decide today?" },
  { id: "monitor", label: "Monitor", question: "What is happening now?", step: 1 },
  { id: "forecast", label: "Forecast", question: "What will we need, and when?", step: 2 },
  { id: "act", label: "Act", question: "What should we order, reduce or keep?", step: 3 },
];

export function AppSidebar({
  activeSection,
  onSectionChange,
}: AppSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectSection = (section: Section) => {
    onSectionChange(section);
    setMobileOpen(false);
  };

  return (
    <>
      <aside className="hidden h-full w-[228px] shrink-0 flex-col bg-[#f3f6f7] md:flex">
        <Brand />
        <nav className="flex-1 space-y-1 px-3 py-5" aria-label="Main navigation">
          {mainMenu.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              active={activeSection === item.id}
              onClick={() => selectSection(item.id)}
            />
          ))}
        </nav>
        <div className="px-4 pb-4">
          <div className="border-t border-[#e8eaec] pt-3 text-xs leading-5 text-[#5d5f60]">
            Caliber inventory
            <span className="block">Read-only local data</span>
          </div>
        </div>
      </aside>

      <div className="relative z-30 shrink-0 bg-[#f3f6f7] md:hidden">
        <header className="flex h-12 items-center justify-between px-4">
          <Brand compact />
          <button
            type="button"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-md text-[#353736] hover:bg-[#ebedee] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>
        {mobileOpen && (
          <div className="fixed inset-0 top-14 z-40 bg-black/20">
            <nav
              className="flex h-full flex-col bg-white p-4"
              aria-label="Main navigation"
            >
              <div className="mb-3 flex items-center justify-between border-b border-[#e8eaec] pb-3">
                <span className="text-sm font-medium">Navigation</span>
                <button
                  type="button"
                  aria-label="Close navigation"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-md hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-1">
                {mainMenu.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    active={activeSection === item.id}
                    onClick={() => selectSection(item.id)}
                  />
                ))}
              </div>
              <p className="mt-auto border-t border-[#e8eaec] pt-3 text-xs leading-5 text-[#5d5f60]">
                Caliber inventory
                <span className="block">Read-only local data</span>
              </p>
            </nav>
          </div>
        )}
      </div>
    </>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex h-12 shrink-0 items-center gap-2 px-4 ${
        compact ? "py-0" : ""
      }`}
    >
      <span className="grid h-7 w-7 place-items-center rounded-md bg-[#1b6c80] text-white">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-[#131416]">
        MIND
      </span>
      <span className="text-xs text-[#5d5f60]">Inventory</span>
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: { id: Section; label: string; question: string; step?: number };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80] ${
        active ? "bg-white shadow-[0_1px_2px_rgba(19,20,22,0.08)]" : "hover:bg-[#ebedee]"
      }`}
    >
      <span
        className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${
          active ? "bg-[#1b6c80] text-white" : "bg-[#dfe3e5] text-[#353736]"
        }`}
        aria-hidden="true"
      >
        {item.step ?? <Sparkles className="h-3.5 w-3.5" />}
      </span>
      <span className="min-w-0">
        <span className={`block text-sm font-semibold ${active ? "text-[#131416]" : "text-[#353736]"}`}>{item.label}</span>
        <span className="block text-xs leading-4 text-[#5d5f60]">{item.question}</span>
      </span>
    </button>
  );
}
