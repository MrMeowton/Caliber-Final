// Semua teks UI di satu tempat → mudah diganti bahasa / gaya pitch.
// Template: {nama} = variabel, **teks** = tebal.

export const LABELS_ID = {
  title: 'Time-machine replay',
  now: 'sekarang',
  anomalyScore: 'Skor anomali AI',
  future: 'belum terjadi',
  threshold: 'Batas alarm {value}',
  aiDetected: 'AI mendeteksi',
  alarm: 'Alarm konvensional',
  forecast: 'Prediksi: {time}',
  leadTime: 'AI {lead} lebih awal',
  scoreStrip: 'AI',
  play: 'Putar',
  pause: 'Jeda',
  seek: 'Geser waktu',
  speed: 'Kecepatan',
  toNow: 'Sekarang ⏭',
  conventional: 'Dashboard konvensional',
  ai: 'AI prediktif',
  conventionalState: { normal: 'NORMAL', alarm: 'ALARM' },
  aiState: { normal: 'SEHAT', warning: 'WASPADA', alarm: 'KRITIS' },
  limit: '{value} {op} batas {threshold}',
  trend: 'tren {value}',
  lessThan: 'kurang dari {value}',
  units: {
    second: { point: 'Detik', duration: 'detik' },
    minute: { point: 'Menit', duration: 'menit' },
    hour: { point: 'Jam', duration: 'jam' },
    day: { point: 'Hari', duration: 'hari' },
  },
  story: {
    normal: 'Semua tampak sehat — nilai stabil di sekitar **{baseline}**.',
    normalHint: ' Tekan ▶ untuk melihat apa yang terjadi selanjutnya.',
    warning: 'AI menangkap tren naik yang **belum terlihat** di dashboard biasa. ',
    warningForecast: 'Prediksi melewati batas pada **{forecastAt}** — masih ada **{remaining}** untuk menjadwalkan perawatan.',
    warningPending: 'Mengumpulkan data untuk proyeksi…',
    alarm: 'Alarm konvensional baru berbunyi pada **{alarmAt}**.',
    alarmLead: ' AI sudah memperingatkan **{lead} lebih awal**',
    alarmError: ' dan prediksi terakhirnya hanya meleset **{error}**',
    end: '.',
  },
}

export const LABELS_EN = {
  title: 'Time-machine replay',
  now: 'now',
  anomalyScore: 'AI anomaly score',
  future: 'not yet happened',
  threshold: 'Alarm limit {value}',
  aiDetected: 'AI detected',
  alarm: 'Conventional alarm',
  forecast: 'Forecast: {time}',
  leadTime: 'AI {lead} earlier',
  scoreStrip: 'AI',
  play: 'Play',
  pause: 'Pause',
  seek: 'Scrub time',
  speed: 'Speed',
  toNow: 'Now ⏭',
  conventional: 'Conventional dashboard',
  ai: 'Predictive AI',
  conventionalState: { normal: 'NORMAL', alarm: 'ALARM' },
  aiState: { normal: 'HEALTHY', warning: 'WARNING', alarm: 'CRITICAL' },
  limit: '{value} {op} limit {threshold}',
  trend: 'trend {value}',
  lessThan: 'less than {value}',
  units: {
    second: { point: 'Second', duration: 's' },
    minute: { point: 'Minute', duration: 'min' },
    hour: { point: 'Hour', duration: 'h' },
    day: { point: 'Day', duration: 'days' },
  },
  story: {
    normal: 'Everything looks healthy — values steady around **{baseline}**.',
    normalHint: ' Press ▶ to see what happens next.',
    warning: 'AI picks up a rising trend that is **not yet visible** on the regular dashboard. ',
    warningForecast: 'Forecast to cross the limit on **{forecastAt}** — **{remaining}** left to schedule maintenance.',
    warningPending: 'Collecting data for a projection…',
    alarm: 'The conventional alarm only fires on **{alarmAt}**.',
    alarmLead: ' AI warned **{lead} earlier**',
    alarmError: ' and its last forecast was off by only **{error}**',
    end: '.',
  },
}

/** Gabungkan override (boleh sebagian) ke label dasar, 1 tingkat objek bersarang. */
export function mergeLabels(base = LABELS_ID, override = {}) {
  const out = { ...base }
  for (const [k, v] of Object.entries(override ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) ? { ...base[k], ...v } : v
  }
  return out
}

/** fill('Halo {nama}', { nama: 'Azka' }) → 'Halo Azka' */
export function fill(template, vars = {}) {
  return String(template).replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m))
}
