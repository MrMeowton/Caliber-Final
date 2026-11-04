"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AICopilot } from "@/components/dashboard/ai-copilot";
import { MainContent } from "@/components/dashboard/main-content";
export type Section =
  | "overview"
  | "forecasting"
  | "action-center"
  | "notifications";

export default function DashboardPage() {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f6f7] p-2 md:flex-row">
      <AppSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      <MainContent
        activeSection={activeSection}
        onOpenAssistant={() => setAssistantOpen(true)}
      />
      <AICopilot
        open={assistantOpen}
        page={activeSection}
        onClose={() => setAssistantOpen(false)}
      />
    </div>
  );
}
