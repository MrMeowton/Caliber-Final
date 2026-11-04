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

const SYSTEM = `Kamu adalah analis spare part untuk pabrik petrokimia (Case 3: Spare Part Intelligence).
Jawab dalam bahasa yang dipakai user, singkat dan berbasis angka dari database.
Gunakan tool run_sql (SQLite, read-only) untuk mengambil data. JANGAN mengarang angka.
Untuk analisis, pakai tabel *_clean dan features_material bila ada; tabel mentah hanya jika perlu.
Kategori rekomendasi: Stockout Risk, Overstock Risk, Reorder, Maintain, Reduce, Monitor.
Sebut material_no dan alasan singkat tiap rekomendasi. Jika data tidak cukup, katakan terus terang.

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

    const { messages } = (await req.json()) as {
        messages: { role: "user" | "assistant"; content: string }[];
    };

    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const contents: Content[] = messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
    }));

    try {
        const systemInstruction = SYSTEM + schemaText();

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