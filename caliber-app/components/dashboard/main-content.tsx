"use client";

import { useState } from "react";
import { Bot } from "lucide-react";
import type { Section } from "@/app/page";
import { OverviewContent } from "./content/overview-content";
import { ActionCenterContent } from "./content/action-center-content";
import { IncidentsContent } from "./content/incidents-content";
import { AlertsContent } from "./content/alerts-content";
import { ForecastingContent } from "./content/forecasting-content";

interface MainContentProps {
  activeSection: Section;
  onOpenAssistant: () => void;
}

const sectionTitles: Record<Section, string> = {
  overview: "MIND · Inventory",
  forecasting: "Demand Intelligence",
  "action-center": "Action Center",
  notifications: "Notifications",
};

export function MainContent({
  activeSection,
  onOpenAssistant,
}: MainContentProps) {
  const [notificationTab, setNotificationTab] = useState<"alerts" | "incidents">("alerts");

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <OverviewContent />;
      case "forecasting":
        return <ForecastingContent />;
      case "action-center":
        return <ActionCenterContent />;
      case "notifications":
        return (
          <div className="space-y-5">
            <nav className="flex gap-5 border-b border-[#e8eaec]" aria-label="Notification views">
              {(["alerts", "incidents"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={notificationTab === tab}
                  onClick={() => setNotificationTab(tab)}
                  className={`min-h-11 border-b-2 px-1 text-sm font-medium capitalize ${
                    notificationTab === tab
                      ? "border-[#1b6c80] text-[#131416]"
                      : "border-transparent text-[#5d5f60] hover:text-[#131416]"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
            {notificationTab === "alerts" ? <AlertsContent /> : <IncidentsContent />}
          </div>
        );
      default:
        return <OverviewContent />;
    }
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 bg-[#f3f6f7] px-3 md:px-5">
        <p className="text-sm font-medium text-[#353736]">
          {sectionTitles[activeSection]}
        </p>
        <button
          type="button"
          onClick={onOpenAssistant}
          className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-md border border-[#cdced1] bg-white px-3 text-sm font-medium text-[#131416] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
        >
          <Bot className="h-4 w-4 text-[#1b6c80]" aria-hidden="true" />
          <span className="hidden sm:inline">Ask MIND AI</span>
          <span className="sm:hidden">AI</span>
        </button>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto rounded-[16px] border border-[#e8eaec] bg-white px-4 py-5 sm:px-6 sm:py-6 md:mb-2 md:mr-2">
        <div key={activeSection} className="animate-fade-in">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
