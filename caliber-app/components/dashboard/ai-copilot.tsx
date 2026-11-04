"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Bot, Send, X } from "lucide-react";
import type { Section } from "@/app/page";

type Message = { role: "user" | "assistant"; content: string };

const pageNames: Record<Section, string> = {
  today: "Today's decisions",
  monitor: "Step 1 · Monitor",
  warehouse: "Warehouse Stock",
  forecast: "Step 2 · Forecast",
  act: "Step 3 · Act",
  orders: "Order Drafts",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function AICopilot({
  open,
  page,
  onClose,
}: {
  open: boolean;
  page: Section;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, pageContext: page }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          isRecord(payload) && typeof payload.error === "string"
            ? payload.error
            : `Assistant request failed (${response.status}).`
        );
      }
      if (!isRecord(payload) || typeof payload.reply !== "string" || !payload.reply) {
        throw new Error("The assistant returned an empty or invalid response.");
      }
      setMessages([...next, { role: "assistant", content: payload.reply }]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to contact the assistant."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close AI assistant"
        onClick={onClose}
        className="fixed inset-0 z-40 bg-[#131416]/25 md:hidden"
      />
      <aside
        aria-label="MIND-PARTS AI assistant"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-[#e8eaec] bg-white shadow-xl md:static md:h-full md:w-[360px] md:max-w-none md:shrink-0 md:rounded-xl md:shadow-none"
      >
        <header className="flex min-h-14 items-center justify-between border-b border-[#e8eaec] px-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#1b6c80]" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-semibold">MIND-PARTS AI Copilot</h2>
              <p className="text-xs text-[#5d5f60]">Context: {pageNames[page]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI assistant"
            className="grid h-9 w-9 place-items-center rounded-md text-[#5d5f60] hover:bg-[#f4f6f8] focus-visible:outline-2 focus-visible:outline-[#1b6c80]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
          {messages.length === 0 && (
            <p className="rounded-md bg-[#f4f6f8] p-3 text-sm leading-6 text-[#353736]">
              Ask about inventory, maintenance exposure, or the data currently in view.
              Answers are based on the read-only local database.
            </p>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`max-w-[92%] whitespace-pre-wrap rounded-lg p-3 text-sm leading-6 ${
                message.role === "user"
                  ? "ml-auto bg-[#1b6c80] text-white"
                  : "mr-auto border border-[#e8eaec] bg-white text-[#131416]"
              }`}
            >
              {message.content}
            </div>
          ))}
          {loading && (
            <p className="text-sm text-[#5d5f60]" role="status">
              Analyzing database evidence…
            </p>
          )}
          {error && (
            <p className="rounded-md bg-[#ffedea] p-3 text-sm text-[#831c1e]" role="alert">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </div>

        <form onSubmit={sendMessage} className="flex gap-2 border-t border-[#e8eaec] p-3">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask a question…"
            aria-label="Message MIND-PARTS AI"
            className="min-h-10 min-w-0 flex-1 rounded-md border border-[#cdced1] px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-[#1b6c80] text-white hover:bg-[#155768] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b6c80]"
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </aside>
    </>
  );
}
