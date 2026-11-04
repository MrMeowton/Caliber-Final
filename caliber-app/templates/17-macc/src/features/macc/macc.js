// Logika murni MACC (Marginal Abatement Cost Curve) — tanpa React.
//
//   Biaya tahunan bersih = capex × CRF(r, umur) + Δopex − penghematan energi
//   MAC (US$/tCO₂e)     = biaya tahunan bersih / abatement tahunan
// MAC negatif = proyek yang MENGHASILKAN uang sambil menurunkan emisi.
// Kurva: proyek diurutkan dari MAC termurah; lebar batang = abatement, tinggi = MAC.

export const crf = (r, n) => (r === 0 ? 1 / n : (r * (1 + r) ** n) / ((1 + r) ** n - 1))

/**
 * opp: { id, name, capex, life, opexDelta?, energySaved?: { [carrier]: qty }, annualSavings?, abatement? }
 * carriers (opsional): { [key]: { price, ef } } — dipakai jika energySaved diisi
 */
export function evaluateOpp(opp, { discountRate = 0.1, carriers = {}, carbonPrice = 0 } = {}) {
  let savings = opp.annualSavings ?? 0
  let abatement = opp.abatement ?? 0
  if (opp.energySaved) {
    for (const [k, q] of Object.entries(opp.energySaved)) {
      savings += q * (carriers[k]?.price ?? 0)
      if (opp.abatement == null) abatement += q * (carriers[k]?.ef ?? 0)
    }
  }
  const annualCapex = (opp.capex ?? 0) * crf(discountRate, opp.life ?? 10)
  const netCost = annualCapex + (opp.opexDelta ?? 0) - savings
  const mac = abatement > 0 ? netCost / abatement : Infinity
  return {
    ...opp,
    savings,
    abatement,
    annualCapex,
    netCost,
    mac,
    // nilai bersih per tahun termasuk harga karbon (≥ 0 → layak pada harga karbon tsb.)
    netValue: abatement * carbonPrice - netCost,
  }
}

/**
 * Bangun kurva + pilih proyek.
 * opsi: { discountRate, carriers, carbonPrice, capexBudget = ∞, target (tCO₂e/thn) }
 * Pemilihan: urut MAC termurah; ambil yang muat di anggaran capex; berhenti setelah target tercapai
 * atau MAC melewati harga karbon (jika `onlyEconomic`).
 */
export function buildMacc(opps, opts = {}) {
  const { capexBudget = Infinity, target = Infinity, carbonPrice = 0, onlyEconomic = false } = opts
  const all = opps.map((o) => evaluateOpp(o, opts))
  const rows = all.filter((o) => o.abatement > 0).sort((a, b) => a.mac - b.mac)
  let x = 0
  let capex = 0
  let picked = 0
  for (const r of rows) {
    r.x0 = x
    x += r.abatement
    r.x1 = x
    const fits = capex + (r.capex ?? 0) <= capexBudget + 1e-9
    const needed = picked < target
    const economic = !onlyEconomic || r.mac <= carbonPrice
    r.selected = fits && needed && economic
    if (r.selected) {
      capex += r.capex ?? 0
      picked += r.abatement
    }
  }
  const sel = rows.filter((r) => r.selected)
  const sum = (arr, k) => arr.reduce((s, r) => s + r[k], 0)
  return {
    rows,
    excluded: all.filter((o) => o.abatement <= 0), // menaikkan emisi (mis. elektrifikasi di grid batu bara)
    totalAbatement: x,
    selectedAbatement: picked,
    selectedCapex: capex,
    selectedNetCost: sum(sel, 'netCost'),
    selectedNetValue: sum(sel, 'netValue'),
    negativeCostAbatement: sum(rows.filter((r) => r.mac < 0), 'abatement'),
    economicAbatement: sum(rows.filter((r) => r.mac <= carbonPrice), 'abatement'),
    avgMac: picked ? sum(sel, 'netCost') / picked : null,
  }
}

export function formatUSD(v, { compact = true, sign = false } = {}) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', notation: compact ? 'compact' : 'standard', maximumFractionDigits: compact ? 1 : 0,
    signDisplay: sign ? 'exceptZero' : 'auto',
  }).format(v)
}

export const formatT = (t) => (Math.abs(t) >= 1000 ? `${(t / 1000).toFixed(1)}k` : `${Math.round(t)}`)
