// mobile/src/components/date/dateFormat.js

export const FECHA_MASK = "YYYY-MM-DD"

// Helpers para validación/format de fecha YYYY-MM-DD
export function formatYYYYMMDD(text) {
  const digits = (text || "").replace(/\D/g, "").slice(0, 8)

  const y = digits.slice(0, 4)
  const m = digits.slice(4, 6)
  const d = digits.slice(6, 8)

  if (digits.length <= 4) return y
  if (digits.length <= 6) return `${y}-${m}`
  return `${y}-${m}-${d}`
}

export function maskFechaGhost(value) {
  const v = value || ""
  let out = ""
  for (let i = 0; i < FECHA_MASK.length; i++) {
    out += v[i] ? " " : FECHA_MASK[i] // si ya hay algo en esa posición, NO muestres sombra
  }
  return out
}

export function isFechaCompleta(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v || "")
}

// hoyStr “seguro” para inicializar estado (mantengo tu versión tal cual)
export function hoyStr() {
  return new Date().toISOString().slice(0, 10)
}

// mobile/src/components/date/dateFormat.js

export function formatFechaDia(fechaStr) {
  if (!fechaStr) return ""
  const fecha = new Date(fechaStr)
  if (Number.isNaN(fecha.getTime())) return ""
  return fecha.toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function formatFechaHora(momento) {
  if (!momento) return ""
  const fecha = new Date(momento)
  if (Number.isNaN(fecha.getTime())) return ""
  return fecha.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}