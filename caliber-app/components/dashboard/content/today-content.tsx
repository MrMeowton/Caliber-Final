"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ArrowRight, CalendarClock, PackageX, Wallet } from "lucide-react";
import type { Navigate, Section } from "@/app/page";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, type Verdict } from "@/components/ui/status";
import { InfoTip } from "@/components/ui/info-tip";
import type { InfoId } from "@/lib/info-copy";
import { ErrorNote, getJSON } from "@/components/demand/ui";
import { fmtIDR, fmtNum, fmtPct } from "@/lib/demand/format";
import { formatDate } from "@/lib/demand/race";

type Part = { material_no: string; description: string; criticality: string };
type Today = {
  asOf: string;
  stockout: {
    count: number; neededByPm90d: number; withOpenPo: number; medianLeadDays: number | null;
    items: (Part & { last_issue: string; pm_90d: number | null; open_po_eta: string | null; lt_p50: number })[];
  };
  overstock: {
    parts: number; boughtParts: number; spend12m: number; excessValue: number; openPoParts: number; openPoValue: number;
    items: (Part & { spend_12m: number; open_po_value: number | null; stock: number; max_qty: number; unit: string })[];
  };
  lateJobs: {
    count: number;
    items: { due_date: string; functional_location: string; item_text: string; waitDays: number; parts: (Part & { waitDays: number })[] }[];
  };
  signals: { slowing: number; releasable: number; wapeStatic: number; wapeMind: number; fillStatic: number; fillDynamic: number };
};

const day = (s: string | null | undefined) => (s ? formatDate(Date.parse(s), { day: "numeric", month: "short" }) : "—");

export function TodayContent({ onNavigate }: { onNavigate: Navigate }) {
  const [data, setData] = useState<Today | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    getJSON<Today>("/api/today", ctrl.signal)
      .then(setData)
      .catch((e) => { if (!ctrl.signal.aborted) setError(String(e.message ?? e)); });
    return () => ctrl.abort();
  }, []);

  const openPart = (sku: string) => onNavigate({ section: "forecast", tab: "sku", sku });

  return (
    <div className="space-y-8 text-[#131416]">
      <PageHeader
        title="What do I need to decide today?"
        subtitle={
          data
            ? <>Three decisions need a planner now, based on stock at {formatDate(Date.parse(data.asOf), { day: "numeric", month: "short", year: "numeric" })}. Each card says what is wrong, why it matters and where to act.</>
            : "Reading stock, forecast and maintenance plan…"
        }
      />

      {error && <ErrorNote error={error} />}
      {!data && !error && <SkeletonCards />}

      {data && (
        <>
          <section className="grid gap-4 xl:grid-cols-3" aria-label="Decisions for today">
            <DecisionCard
              verdict="act"
              kind="Stockout risk"
              icon={<PackageX className="h-5 w-5" aria-hidden="true" />}
              info="today.stockout"
              number={fmtNum(data.stockout.count)}
              problem="critical parts are out of stock, although the plant has used them before"
              impact={
                <>
                  A breakdown waits <b>~{fmtNum(data.stockout.medianLeadDays)} days</b> for supply. <b>{fmtNum(data.stockout.neededByPm90d)}</b> needed by maintenance within 90 days; {fmtNum(data.stockout.withOpenPo)} on order.
                </>
              }
              action={{ label: "Review & reorder", onClick: () => onNavigate({ section: "act", tab: "reorder" }) }}
              listTitle="Most urgent"
              list={data.stockout.items.map((p) => ({
                key: p.material_no,
                title: p.description,
                crit: p.criticality,
                detail: p.pm_90d ? `needed by maintenance soon · last used ${day(p.last_issue)}` : `last used ${day(p.last_issue)}`,
                onClick: () => openPart(p.material_no),
              }))}
            />
            <DecisionCard
              verdict="watch"
              kind="Overstock risk"
              icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
              info="today.overstock"
              number={fmtIDR(data.overstock.spend12m)}
              problem={`spent in the last 12 months on ${fmtNum(data.overstock.boughtParts)} parts that are already above their Max`}
              impact={
                <>
                  <b>{fmtIDR(data.overstock.openPoValue)}</b> in open orders on {fmtNum(data.overstock.openPoParts)} parts can still be stopped.
                </>
              }
              action={{ label: "See stop-buy list", onClick: () => onNavigate({ section: "monitor", tab: "health" }) }}
              listTitle="Largest spend"
              list={data.overstock.items.map((p) => ({
                key: p.material_no,
                title: p.description,
                crit: p.criticality,
                detail: `${fmtIDR(p.spend_12m)} bought · stock ${fmtNum(p.stock)} vs Max ${fmtNum(p.max_qty)}${p.open_po_value ? ` · ${fmtIDR(p.open_po_value)} still on order` : ""}`,
                onClick: () => openPart(p.material_no),
              }))}
            />
            <DecisionCard
              verdict="act"
              kind="Maintenance at risk"
              icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
              info="today.lateJobs"
              number={fmtNum(data.lateJobs.count)}
              problem="planned maintenance jobs in October will wait for a part"
              impact={
                data.lateJobs.items[0] ? (
                  <>
                    First: <b>{data.lateJobs.items[0].item_text}</b> ({day(data.lateJobs.items[0].due_date)}), part <b>{fmtNum(data.lateJobs.items[0].waitDays)} days late</b>.
                  </>
                ) : (
                  "Every October job has its parts on time."
                )
              }
              action={{ label: "See timeline", onClick: () => onNavigate({ section: "forecast", tab: "race" }) }}
              listTitle="Jobs that will wait"
              list={data.lateJobs.items.map((j) => ({
                key: `${j.functional_location}-${j.due_date}-${j.item_text}`,
                title: `${day(j.due_date)} · ${j.item_text}`,
                crit: j.parts[0]?.criticality ?? "C",
                detail: `${j.functional_location.replace(/^PX_/, "")} · ${j.parts.length} part${j.parts.length === 1 ? "" : "s"} late, up to ${fmtNum(j.waitDays)} days`,
                onClick: () => openPart(j.parts[0].material_no),
              }))}
            />
          </section>

          <section aria-label="Other signals">
            <h2 className="text-lg font-semibold">Also worth knowing</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Signal
                verdict="watch"
                title={`${fmtNum(data.signals.slowing)} parts are slowing down`}
                text="Use fell over 70% in 6 months."
                link="Inventory health"
                onClick={() => onNavigate({ section: "monitor", tab: "health" })}
              />
              <Signal
                verdict="ok"
                title={`Forecast error ${fmtPct(data.signals.wapeStatic)} → ${fmtPct(data.signals.wapeMind)}`}
                text="Tested on 5 unseen months."
                link="Forecast accuracy"
                onClick={() => onNavigate({ section: "forecast", tab: "backtest" })}
              />
              <Signal
                verdict="ok"
                title={`Parts on the shelf when needed ${fmtPct(data.signals.fillStatic)} → ${fmtPct(data.signals.fillDynamic)}`}
                text="Recommended vs current Min–Max, May–Sep 2026."
                link="Recommended Min–Max"
                onClick={() => onNavigate({ section: "act", tab: "minmax" })}
              />
            </div>
          </section>
        </>
      )}

      <section aria-label="How MIND works">
        <h2 className="text-lg font-semibold">How MIND works</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-3">
          {STEPS.map((s) => (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => onNavigate({ section: s.section })}
                className="flex h-full w-full flex-col rounded-lg border border-[#e8eaec] bg-white p-4 text-left hover:bg-[#f9fbfc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-[#1b6c80] text-sm font-semibold text-white">{s.n}</span>
                  <span className="text-base font-semibold">{s.name}</span>
                </span>
                <span className="mt-2 text-[15px] font-medium text-[#131416]">{s.question}</span>
                <span className="mt-1 flex-1 text-sm leading-5 text-[#45484a]">{s.what}</span>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1b6c80]">
                  Open {s.name} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

const STEPS: { n: number; name: string; section: Section; question: string; what: string }[] = [
  { n: 1, name: "Monitor", section: "monitor", question: "What is happening to our spare parts now?", what: "Stock health · 3D plant map · dead stock" },
  { n: 2, name: "Forecast", section: "forecast", question: "What will we need, and when?", what: "Demand forecast · failures · AI run-out date" },
  { n: 3, name: "Act", section: "act", question: "What should we order, reduce or keep?", what: "Reorder · dynamic Min–Max · cost vs risk" },
];

type ListItem = { key: string; title: string; crit: string; detail: string; onClick: () => void };

function DecisionCard({
  verdict, kind, icon, info, number, problem, impact, action, listTitle, list,
}: {
  verdict: Verdict; kind: string; icon: ReactNode; info: InfoId; number: string; problem: string; impact: ReactNode;
  action: { label: string; onClick: () => void }; listTitle: string; list: ListItem[];
}) {
  const accent = verdict === "act" ? "text-[#b42318]" : "text-[#8a5300]";
  return (
    <article className="relative flex flex-col rounded-xl border border-[#e8eaec] bg-white p-5 shadow-[0_1px_2px_rgba(19,20,22,0.05)]">
      <InfoTip id={info} className="absolute right-3 top-3" />
      <div className="flex items-center gap-2 pr-8">
        <span className={accent}>{icon}</span>
        <span className="text-sm font-semibold text-[#353736]">{kind}</span>
        <StatusBadge verdict={verdict} />
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#5d5f60]">Problem</p>
      <p className="mt-1 leading-snug">
        <span className={`text-4xl font-semibold tabular-nums ${accent}`}>{number}</span>{" "}
        <span className="text-[17px] font-medium">{problem}</span>
      </p>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#5d5f60]">Why it matters</p>
      <p className="mt-1 text-[15px] leading-6 text-[#353736]">{impact}</p>

      <button
        type="button"
        onClick={action.onClick}
        className={`mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80] ${
          verdict === "act" ? "bg-[#b42318] hover:bg-[#912018]" : "bg-[#1b6c80] hover:bg-[#155768]"
        }`}
      >
        {action.label}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {list.length > 0 && (
        <details className="group mt-4 border-t border-[#f0f1f2] pt-3">
          <summary className="cursor-pointer text-sm font-semibold text-[#1b6c80] focus-visible:outline-2 focus-visible:outline-[#1b6c80]">
            {listTitle} ({list.length})
          </summary>
          <ul className="mt-2 divide-y divide-[#f0f1f2]">
            {list.map((item) => (
              <li key={item.key}>
                <button type="button" onClick={item.onClick} className="w-full py-2 text-left hover:bg-[#f9fbfc] focus-visible:outline-2 focus-visible:outline-[#1b6c80]">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-[#5d5f60]">Criticality {item.crit} · {item.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </article>
  );
}

function Signal({ verdict, title, text, link, onClick }: { verdict: Verdict; title: string; text: string; link: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full flex-col rounded-lg border border-[#e8eaec] bg-white p-4 text-left hover:bg-[#f9fbfc] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
    >
      <StatusBadge verdict={verdict} />
      <span className="mt-2 text-base font-semibold">{title}</span>
      <span className="mt-1 flex-1 text-sm leading-5 text-[#45484a]">{text}</span>
      <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#1b6c80]">
        {link} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </span>
    </button>
  );
}

function SkeletonCards() {
  return (
    <div className="grid gap-4 xl:grid-cols-3" aria-label="Loading decisions">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-72 animate-pulse rounded-xl border border-[#e8eaec] bg-[#f7f8f9]" />
      ))}
    </div>
  );
}
