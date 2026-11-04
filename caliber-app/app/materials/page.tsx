import { Suspense } from "react";
import { connection } from "next/server";
import { db } from "@/lib/db";

type Row = {
    functional_loc: string;
    material_no: string;
    material_desc: string | null;
    installed_qty: number | null;
    unit: string | null;
    min_qty: number | null;
    max_qty: number | null;
    stock: number | null;
    mrp_type: string | null;
};

async function BomTable() {
    await connection(); // tandai dinamis (pengganti `dynamic = "force-dynamic"`)

    const rows = db
        .prepare(
            `SELECT functional_loc, material_no, material_desc, installed_qty,
              unit, min_qty, max_qty, stock, mrp_type
       FROM bom
       ORDER BY functional_loc, material_no
       LIMIT    `
        )
        .all() as Row[];

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b text-left">
                    <th className="p-2">Functional Loc</th>
                    <th className="p-2">Material</th>
                    <th className="p-2">Description</th>
                    <th className="p-2">Installed</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Min</th>
                    <th className="p-2">Max</th>
                    <th className="p-2">MRP</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((r) => (
                    <tr
                        key={`${r.functional_loc}-${r.material_no}`}
                        className={
                            (r.stock ?? 0) < (r.min_qty ?? 0) ? "bg-red-500/10" : "border-b"
                        }
                    >
                        <td className="p-2">{r.functional_loc}</td>
                        <td className="p-2">{r.material_no}</td>
                        <td className="p-2">{r.material_desc}</td>
                        <td className="p-2">{r.installed_qty} {r.unit}</td>
                        <td className="p-2">{r.stock}</td>
                        <td className="p-2">{r.min_qty}</td>
                        <td className="p-2">{r.max_qty}</td>
                        <td className="p-2">{r.mrp_type}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default function MaterialsPage() {
    return (
        <main className="p-6">
            <h1 className="mb-4 text-2xl font-bold">Spare Part Intelligence</h1>
            <Suspense fallback={<p>Loading...</p>}>
                <BomTable />
            </Suspense>
        </main>
    );
}