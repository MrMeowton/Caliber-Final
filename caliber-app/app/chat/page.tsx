"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatPage() {
    const [messages, setMessages] = useState<Msg[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    async function send() {
        const text = input.trim();
        if (!text || loading) return;
        const next: Msg[] = [...messages, { role: "user", content: text }];
        setMessages(next);
        setInput("");
        setLoading(true);
        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: next }),
            });
            const data = await res.json();
            setMessages([
                ...next,
                { role: "assistant", content: data.reply ?? `Error: ${data.error}` },
            ]);
        } catch (e) {
            setMessages([...next, { role: "assistant", content: `Error: ${String(e)}` }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="mx-auto flex h-screen max-w-3xl flex-col p-6">
            <h1 className="mb-4 text-2xl font-bold">Spare Part AI</h1>

            <div className="flex-1 space-y-3 overflow-y-auto">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={
                            m.role === "user"
                                ? "ml-auto max-w-[80%] rounded-lg bg-blue-600 p-3 text-white"
                                : "mr-auto max-w-[80%] whitespace-pre-wrap rounded-lg bg-gray-500/20 p-3"
                        }
                    >
                        {m.content}
                    </div>
                ))}
                {loading && <p className="text-sm opacity-60">Menganalisis...</p>}
            </div>

            <div className="mt-4 flex gap-2">
                <input
                    className="flex-1 rounded-lg border p-3"
                    placeholder="Contoh: material mana yang berisiko stockout?"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                />
                <button
                    className="rounded-lg bg-blue-600 px-4 py-3 text-white disabled:opacity-50"
                    onClick={send}
                    disabled={loading}
                >
                    Kirim
                </button>
            </div>
        </main>
    );
}