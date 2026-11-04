// Every page opens with the question it answers. Steps 1–3 follow the deck: Monitor → Forecast → Act.
import type { ReactNode } from "react";

// subtitle is accepted for compatibility but not rendered: the question title and the ⓘ explain the page.
export function PageHeader({ step, title, right }: { step?: number; title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <section className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {step !== undefined && (
          <span
            className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#1b6c80] text-base font-semibold text-white"
            aria-label={`Step ${step}`}
          >
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-8 tracking-[-0.01em] text-[#131416]">{title}</h1>
        </div>
      </div>
      {right}
    </section>
  );
}
