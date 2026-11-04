// Definisi tipe (JSDoc) — memberi autocomplete di VS Code tanpa TypeScript.
// Tidak ada kode runtime di sini.

/**
 * Satu titik data sensor.
 * @typedef {{ t: number, v: number }} Point   t = waktu (satuan bebas, mis. hari), v = nilai
 */

/**
 * Keluaran analyzer. Model apa pun (bawaan / backend) cukup menghasilkan bentuk ini.
 * @typedef {object} Analysis
 * @property {number} mean          baseline / nilai normal
 * @property {number} sd            sebaran normal (dipakai forecaster bawaan)
 * @property {number[]} smooth      tren yang dilihat AI, sejajar dengan series
 * @property {number[]} score       skor anomali 0..1, sejajar dengan series
 * @property {number} detectIndex   index saat AI mendeteksi (-1 = belum)
 * @property {number} crossIndex    index saat alarm konvensional (-1 = belum)
 * @property {number} threshold     batas alarm
 */

/**
 * Prediksi yang dibuat pada satu titik waktu.
 * @typedef {object} Forecast
 * @property {number} t             waktu prediksi melewati batas
 * @property {number} remaining     sisa waktu dari "sekarang"
 * @property {Point[]} points       lengkung proyeksi (untuk digambar)
 */

/**
 * @typedef {(series: Point[], options: { threshold: number } & Record<string, any>) => Analysis} Analyzer
 * @typedef {(series: Point[], analysis: Analysis, index: number, options?: object) => Forecast | null} Forecaster
 * @typedef {'normal' | 'warning' | 'alarm'} Stage
 */

export {}
