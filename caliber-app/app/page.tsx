"use client";

import { useCallback, useState } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AICopilot } from "@/components/dashboard/ai-copilot";
import { MainContent } from "@/components/dashboard/main-content";

export type Section = "today" | "monitor" | "warehouse" | "forecast" | "act" | "orders";

/** Where a button sends the user: a page, optionally a tab inside it and a part to open. */
export type NavTarget = { section: Section; tab?: string; sku?: string };
export type Navigate = (target: NavTarget) => void;

export default function DashboardPage() {
  const [nav, setNav] = useState<NavTarget & { n: number }>({ section: "today", n: 0 });
  const [assistantOpen, setAssistantOpen] = useState(false);

  // n forces the page to remount so the requested tab opens even when the page is already showing.
  const navigate = useCallback<Navigate>((target) => setNav((cur) => ({ ...target, n: cur.n + 1 })), []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f6f7] p-2 md:flex-row">
      <AppSidebar activeSection={nav.section} onSectionChange={(section) => navigate({ section })} />
      <MainContent nav={nav} onNavigate={navigate} onOpenAssistant={() => setAssistantOpen(true)} />
      <AICopilot open={assistantOpen} page={nav.section} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
