// =========================================
// Data contoh: satu jalur proses pabrik + faktor penyebab
// -----------------------------------------
// Ganti file ini dengan data asli (API / database).
// Bentuk data cukup dua array:
//   node : { id, kind: 'process' | 'cause', label, status: 'ok' | 'warn' | 'alarm', value?, note? }
//   edge : { source, target, kind: 'flow' | 'cause' }
//     flow  = aliran material antar unit proses (diagram proses)
//     cause = "source memengaruhi target" (graf sebab-akibat)
// Posisi node TIDAK perlu diisi — dihitung otomatis oleh layoutGraph().
// =========================================

export const plantNodes = [
  // ---- Alur proses ----
  { id: 'feed', kind: 'process', label: 'Tangki Umpan T-100', status: 'ok', value: 'Level 72%' },
  { id: 'pump', kind: 'process', label: 'Pompa P-101', status: 'warn', value: 'Flow 38 m³/h' },
  { id: 'hx', kind: 'process', label: 'Heat Exchanger E-201', status: 'warn', value: 'Outlet 142 °C' },
  { id: 'reactor', kind: 'process', label: 'Reaktor R-301', status: 'alarm', value: 'Suhu 171 °C' },
  { id: 'qc', kind: 'process', label: 'Produk (QC)', status: 'alarm', value: 'MFI off-spec' },

  // ---- Faktor penyebab ----
  { id: 'bearing', kind: 'cause', label: 'Getaran bearing tinggi', status: 'alarm', value: '9.1 mm/s', note: 'Batas 7.1 mm/s (ISO 10816)' },
  { id: 'fouling', kind: 'cause', label: 'Fouling tube', status: 'alarm', value: 'U turun 28%', note: 'Pembersihan terakhir 14 bulan lalu' },
  { id: 'cooling', kind: 'cause', label: 'Suhu air pendingin naik', status: 'warn', value: '34 °C', note: 'Cooling tower beban penuh' },
  { id: 'sensor', kind: 'cause', label: 'Drift sensor TT-301', status: 'ok', value: 'Kalibrasi OK' },
  { id: 'catalyst', kind: 'cause', label: 'Aktivitas katalis', status: 'ok', value: '97%' },
]

export const plantEdges = [
  { source: 'feed', target: 'pump', kind: 'flow' },
  { source: 'pump', target: 'hx', kind: 'flow' },
  { source: 'hx', target: 'reactor', kind: 'flow' },
  { source: 'reactor', target: 'qc', kind: 'flow' },

  { source: 'bearing', target: 'pump', kind: 'cause' },
  { source: 'fouling', target: 'hx', kind: 'cause' },
  { source: 'cooling', target: 'hx', kind: 'cause' },
  { source: 'sensor', target: 'reactor', kind: 'cause' },
  { source: 'catalyst', target: 'reactor', kind: 'cause' },
]
