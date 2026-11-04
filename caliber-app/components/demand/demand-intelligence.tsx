"use client";

import { useEffect, useState } from "react";
import { BarChart3, CalendarClock, Flag, Gauge, PackageSearch } from "lucide-react";
import { ErrorNote, Loading, getJSON } from "./ui";
import { PageHeader } from "@/components/ui/page-header";
import { OverviewTab } from "./overview-tab";
import { SkuTab } from "./sku-tab";
import { PmCalendarTab } from "./pm-calendar-tab";
import { RaceTab } from "./race-tab";
import { BacktestTab } from "./backtest-tab";
import type { Summary } from "./types";

type Tab = "overview" | "sku" | "pm" | "race" | "backtest";

const TABS: { id: Tab; label: string; icon: typeof Gauge }[] = [
  { id: "overview", label: "Demand drivers", icon: Gauge },
  { id: "sku", label: "One part in detail", icon: PackageSearch },
  { id: "pm", label: "Parts for planned maintenance", icon: CalendarClock },
  { id: "race", label: "Part Race", icon: Flag },
  { id: "backtest", label: "Forecast accuracy", icon: BarChart3 },
];
const isTab = (v: string | undefined): v is Tab => TABS.some((t) => t.id === v);

/**
 * Feature 2 — Demand Intelligence (Forecast · answers KQ1).
 * Demand decomposition, demand-class models with backtest, PM-driven demand calendar,
 * abnormal consumption, and three Learning-By-Building modules wired to the case data:
 * #09 spare-part race, #14 spare-part economics, #15 NPV engine (stock vs buy-on-demand).
 */
export function DemandIntelligence({ initialTab, initialSku }: { initialTab?: string; initialSku?: string } = {}) {
  const [tab, setTab] = useState<Tab>(initialSku ? "sku" : isTab(initialTab) ? initialTab : "overview");
  const [skuId, setSkuId] = useState<string | undefined>(initialSku);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Summary>("/api/demand/summary", ctrl.signal)
      .then(setSummary)
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, []);

  const openSku = (id: string) => { setSkuId(id); setTab("sku"); };

  return (
    <div className="min-h-full space-y-6 text-[#131416]">
      <PageHeader
        step={2}
        title="Demand forecast and timing"
        subtitle="Spare-part demand is irregular. MIND-PARTS splits it into everyday use, planned maintenance, equipment failures and one-off events, forecasts each one, and checks the forecast against months it had not seen."
      />

      <nav className="flex gap-5 overflow-x-auto border-b border-[#e8eaec]" aria-label="Demand intelligence views">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? "page" : undefined}
              onClick={() => setTab(t.id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-1 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80] ${
                tab === t.id
                  ? "border-[#1b6c80] text-[#131416]"
                  : "border-transparent text-[#5d5f60] hover:text-[#131416]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {error && <ErrorNote error={error} />}
      {tab === "overview" && (summary ? <OverviewTab data={summary} onOpenTab={(t) => setTab(t as Tab)} /> : !error && <Loading />)}
      {tab === "sku" && <SkuTab initialId={skuId} />}
      {tab === "pm" && <PmCalendarTab onOpenRace={() => setTab("race")} />}
      {tab === "race" && <RaceTab />}
      {tab === "backtest" && (summary ? <BacktestTab data={summary} onOpenSku={openSku} /> : !error && <Loading />)}
    </div>
  );
}
