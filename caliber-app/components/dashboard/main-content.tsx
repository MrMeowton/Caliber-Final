"use client";

import { Bot } from "lucide-react";
import type { NavTarget, Navigate, Section } from "@/app/page";
import { DataNotes } from "@/components/ui/data-notes";
import { TodayContent } from "./content/today-content";
import { OverviewContent } from "./content/overview-content";
import { ActionCenterContent } from "./content/action-center-content";
import { DemandIntelligence } from "@/components/demand/demand-intelligence";

const crumbs: Record<Section, string> = {
  today: "Today's decisions",
  monitor: "Step 1 · Monitor",
  forecast: "Step 2 · Forecast",
  act: "Step 3 · Act",
};

export function MainContent({
  nav,
  onNavigate,
  onOpenAssistant,
}: {
  nav: NavTarget & { n: number };
  onNavigate: Navigate;
  onOpenAssistant: () => void;
}) {
  const content = () => {
    switch (nav.section) {
      case "monitor":
        return <OverviewContent initialTab={nav.tab} onNavigate={onNavigate} />;
      case "forecast":
        return <DemandIntelligence initialTab={nav.tab} initialSku={nav.sku} />;
      case "act":
        return <ActionCenterContent onNavigate={onNavigate} initialFocus={nav.tab} />;
      default:
        return <TodayContent onNavigate={onNavigate} />;
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 bg-[#f3f6f7] px-3 md:px-5">
        <p className="truncate text-sm font-medium text-[#353736]">{crumbs[nav.section]}</p>
        <div className="flex items-center gap-2">
          <DataNotes />
          <button
            type="button"
            onClick={onOpenAssistant}
            className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md bg-[#1b6c80] px-3 text-sm font-semibold text-white hover:bg-[#155768] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            <Bot className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Ask MIND AI</span>
            <span className="sm:hidden">AI</span>
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto rounded-[16px] border border-[#e8eaec] bg-white px-4 py-5 sm:px-6 sm:py-6 md:mb-2 md:mr-2">
        <div key={`${nav.section}-${nav.n}`} className="animate-fade-in">
          {content()}
        </div>
      </main>
    </div>
  );
}
