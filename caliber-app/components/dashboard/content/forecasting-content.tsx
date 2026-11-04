"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ForecastData = {
  kpis: {
    healthIndex: number | null;
    maintenancePlansDue90d: number;
  };
  coverage: { movementStart: string | null; movementThrough: string | null };
  issueTrend: Array<{ month: string; postings: number }>;
  maintenanceTrend: Array<{ month: string; plans: number }>;
};

function isData(value: unknown): value is ForecastData {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.kpis === "object" &&
    record.kpis !== null &&
    typeof record.coverage === "object" &&
    record.coverage !== null &&
    Array.isArray(record.issueTrend) &&
    Array.isArray(record.maintenanceTrend)
  );
}

function formatMonth(month: string) {
  const [year, value] = month.split("-");
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(Number(year), Number(value) - 1, 1)
  );
}

export function ForecastingContent() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/inventory/dashboard", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : `Forecast data request failed (${response.status}).`;
          throw new Error(message);
        }
        if (!isData(payload)) throw new Error("Forecast data has an unexpected shape.");
        setData(payload);
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "Unable to load forecast inputs."
          );
        }
      });
    return () => controller.abort();
  }, []);

  if (error) {
    return (
      <section className="rounded-lg border border-[#e8eaec] p-5" role="alert">
        <h1 className="text-xl font-semibold">Demand Intelligence</h1>
        <p className="mt-2 text-sm text-[#831c1e]">{error}</p>
      </section>
    );
  }
  if (!data) {
    return <p className="text-sm text-[#5d5f60]" role="status">Loading forecast inputs…</p>;
  }

  const health =
    data.kpis.healthIndex === null
      ? "Unavailable"
      : `${Math.round(data.kpis.healthIndex * 100)}%`;
  const movementWindow = `${data.coverage.movementStart ?? "Unknown"} – ${
    data.coverage.movementThrough ?? "Unknown"
  }`;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-[22px] font-semibold leading-7">Demand Intelligence</h1>
        <p className="mt-1 text-sm text-[#5d5f60]">
          Observed issue activity and estimated maintenance roadmap.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="border-y border-[#e8eaec] py-3">
          <p className="text-sm text-[#5d5f60]">Stock policy health</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">{health}</p>
        </div>
        <div className="border-y border-[#e8eaec] py-3">
          <p className="text-sm text-[#5d5f60]">Maintenance plan items · 90 days</p>
          <p className="mt-1 text-2xl font-medium tabular-nums">
            {new Intl.NumberFormat("en-US").format(data.kpis.maintenancePlansDue90d)}
          </p>
        </div>
        <div className="border-y border-[#e8eaec] py-3">
          <p className="text-sm text-[#5d5f60]">Issue history coverage</p>
          <p className="mt-1 text-sm font-medium">{movementWindow}</p>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-base font-semibold">Issue activity</CardTitle>
            <p className="text-sm text-[#5d5f60]">
              Monthly ISSUE posting count; quantity demand is not available here.
            </p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.issueTrend}>
                  <CartesianGrid vertical={false} stroke="#e8eaec" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(value) => formatMonth(String(value))} />
                  <Area dataKey="postings" name="Issue postings" stroke="#1b6c80" fill="#1b6c80" fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 rounded-lg border-[#e8eaec] py-0 shadow-none">
          <CardHeader className="px-5 py-4">
            <CardTitle className="text-base font-semibold">Maintenance roadmap</CardTitle>
            <p className="text-sm text-[#5d5f60]">
              Estimated recurring plan occurrences across the next six months.
            </p>
          </CardHeader>
          <CardContent className="px-3 pb-4">
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.maintenanceTrend}>
                  <CartesianGrid vertical={false} stroke="#e8eaec" />
                  <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(value) => formatMonth(String(value))} />
                  <Area dataKey="plans" name="Estimated plan items" stroke="#2f70bb" fill="#2f70bb" fillOpacity={0.12} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      <p className="text-xs leading-5 text-[#5d5f60]">
        This view is a data-backed baseline, not a statistical consumption forecast. Issue
        history records posting counts rather than quantities, and maintenance dates are
        estimated from plan cycles.
      </p>
    </div>
  );
}
