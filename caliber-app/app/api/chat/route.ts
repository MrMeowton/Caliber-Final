import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, type Content } from "@google/genai";
import { db } from "@/lib/db";

const API_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
// Urutan model: utama dulu, lalu cadangan (dipakai jika 503/429/404)
const MODELS = [
    process.env.GEMINI_MODEL ?? "gemini-flash-latest",
    ...(process.env.GEMINI_FALLBACK_MODELS ?? "gemini-flash-lite-latest,gemini-2.5-flash")
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
];
const MAX_STEPS = 6;
const MAX_ROWS = 50;
const PAGE_CONTEXTS: Record<string, string> = {
    today: "Today's decisions (stockout, overstock and late maintenance jobs)",
    monitor: "Step 1 Monitor (stock health, 3D plant, inventory health)",
    forecast: "Step 2 Forecast (demand forecast, failures, maintenance demand)",
    act: "Step 3 Act (reorder list, recommended Min-Max, cost vs risk, AI to-do list)",
    orders: "Order Drafts (saved local reorder estimates and frontend-only PR/PO form)",
};

const SYSTEM = `You are a spare-parts analyst for a petrochemical plant (Case 3: Spare Part Intelligence).
Answer in concise English and ground numerical claims in database evidence.
Use run_sql (SQLite, read-only) to retrieve data. Never invent figures.
Prefer *_clean tables and features_material for analysis; use raw tables only when needed.
Recommendation categories: Stockout Risk, Overstock Risk, Reorder, Maintain, Reduce, Monitor.
Include material_no and a brief reason for each recommendation. State plainly when the data is insufficient.

Skema database:
`;

const runSqlDecl = {
    name: "run_sql",
    description: `Jalankan satu query SELECT SQLite (read-only). Maksimal ${MAX_ROWS} baris dikembalikan, jadi gunakan agregasi/ORDER BY/LIMIT.`,
    parameters: {
        type: Type.OBJECT,
        properties: { query: { type: Type.STRING, description: "Query SELECT tunggal" } },
        required: ["query"],
    },
};

function schemaText() {
    const tables = db
        .prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%' order by name")
        .all() as { name: string }[];
    return tables
        .map((t) => {
            const cols = db.prepare(`pragma table_info("${t.name}")`).all() as { name: string }[];
            return `${t.name}(${cols.map((c) => c.name).join(", ")})`;
        })
        .join("\n");
}

function runSql(query: string) {
    const q = query.trim().replace(/;+\s*$/, "");
    if (!/^(select|with)\b/i.test(q)) return { error: "Hanya query SELECT yang diizinkan." };
    try {
        const rows = db.prepare(`SELECT * FROM (${q}) LIMIT ${MAX_ROWS}`).all();
        return { row_count: rows.length, rows };
    } catch (e) {
        return { error: String(e) };
    }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Coba tiap model 2x untuk 503/429, lalu pindah ke model berikutnya.
async function generate(
    ai: GoogleGenAI,
    args: { contents: Content[]; config: Parameters<GoogleGenAI["models"]["generateContent"]>[0]["config"] }
) {
    for (const model of MODELS) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                return await ai.models.generateContent({ model, ...args });
            } catch (e) {
                const status = (e as { status?: number }).status;
                console.warn(`[chat] ${model} gagal (status ${status}), percobaan ${attempt + 1}`);
                if (status === 503 || status === 429) {
                    await sleep(800 * (attempt + 1));
                    continue; // ulang model yang sama
                }
                if (status === 404 || status === 500 || status === 504) break; // model berikutnya
                throw e; // 400/401/403 dll: bukan masalah model, jangan diulang
            }
        }
    }
    throw new Error("Semua model sedang sibuk atau tidak tersedia. Coba lagi sebentar.");
}

export async function POST(req: NextRequest) {
    if (!API_KEY) {
        return NextResponse.json(
            { error: "GEMINI_API_KEY belum di-set di caliber-app/.env.local" },
            { status: 500 }
        );
    }

    const body: unknown = await req.json();
    if (
        typeof body !== "object" ||
        body === null ||
        !("messages" in body) ||
        !Array.isArray(body.messages) ||
        body.messages.length === 0 ||
        body.messages.length > 40 ||
        !body.messages.every(
            (message) =>
                typeof message === "object" &&
                message !== null &&
                (message.role === "user" || message.role === "assistant") &&
                typeof message.content === "string" &&
                message.content.length <= 24000
        )
    ) {
        return NextResponse.json({ error: "Invalid chat messages." }, { status: 400 });
    }

    const messages = body.messages as { role: "user" | "assistant"; content: string }[];
    const pageContext =
        "pageContext" in body && typeof body.pageContext === "string"
            ? PAGE_CONTEXTS[body.pageContext]
            : undefined;

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const contents: Content[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    try {
        const systemInstruction =
            SYSTEM +
            schemaText() +
            (pageContext ? `\nCurrent dashboard page: ${pageContext}. Use this only as conversational context.` : "");

        for (let step = 0; step < MAX_STEPS; step++) {
            const res = await generate(ai, {
                contents,
                config: { systemInstruction, tools: [{ functionDeclarations: [runSqlDecl] }] },
            });

            const calls = res.functionCalls;
            if (!calls || calls.length === 0) {
                return NextResponse.json({ reply: res.text ?? "" });
            }

            // kembalikan giliran model apa adanya, lalu hasil tool
            contents.push(res.candidates![0].content!);
            contents.push({
                role: "user",
                parts: calls.map((c) => {
                    const sql = String((c.args as { query?: string } | undefined)?.query ?? "");
                    console.log("[chat] run_sql:", sql); // debug: lihat query yang dibuat AI
                    return { functionResponse: { id: c.id, name: c.name, response: runSql(sql) } };
                }),
            });
        }

        return NextResponse.json({ reply: "Terlalu banyak langkah query. Coba pertanyaan yang lebih spesifik." });
    } catch (e) {
        console.error("[api/chat]", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}