const clampToStartOfDay = (date) => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const clampToEndOfDay = (date) => {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export const formatLocalYyyyMmDd = (date) => {
  const d = new Date(date)
  if (Number.isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseLocalYyyyMmDd = (value) => {
  if (!value || typeof value !== 'string') return null
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const d = new Date(year, monthIndex, day)
  if (Number.isNaN(d.getTime())) return null
  if (d.getFullYear() !== year || d.getMonth() !== monthIndex || d.getDate() !== day) return null
  return d
}

export const getLocalTodayRange = (now = new Date()) => {
  const start = clampToStartOfDay(now)
  const end = clampToEndOfDay(now)
  return { start, end }
}

export const getLocalCurrentMonthRange = (now = new Date()) => {
  const d = new Date(now)
  const year = d.getFullYear()
  const monthIndex = d.getMonth()
  const start = new Date(year, monthIndex, 1, 0, 0, 0, 0)
  const end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export const getLocalRangeFromInputs = (desdeStr, hastaStr) => {
  const desde = parseLocalYyyyMmDd(desdeStr)
  const hasta = parseLocalYyyyMmDd(hastaStr)
  if (!desde || !hasta) {
    return { error: 'Ingresa ambas fechas en formato YYYY-MM-DD' }
  }

  const start = clampToStartOfDay(desde)
  const end = clampToEndOfDay(hasta)

  if (start.getTime() > end.getTime()) {
    return { error: 'La fecha "Desde" debe ser menor o igual que "Hasta"' }
  }

  return { start, end }
}

const normalizeTipo = (tipo) => {
  if (!tipo) return ''
  return String(tipo).trim().toLowerCase()
}

export const summarizeMovimientosInRange = (movimientos, start, end) => {
  if (!Array.isArray(movimientos) || !start || !end) {
    return { ingresos: 0, gastos: 0, neto: 0, count: 0 }
  }

  const startTime = start.getTime()
  const endTime = end.getTime()

  let ingresos = 0
  let gastos = 0
  let count = 0

  for (const mov of movimientos) {
    const fecha = new Date(mov?.momento_reg)
    const time = fecha.getTime()
    if (Number.isNaN(time)) continue
    if (time < startTime || time > endTime) continue

    const monto = Number(mov?.monto) || 0
    const tipo = normalizeTipo(mov?.tipo)
    if (tipo === 'ingreso') {
      ingresos += monto
      count += 1
    } else if (tipo === 'gasto') {
      gastos += monto
      count += 1
    }
  }

  const neto = ingresos - gastos
  return { ingresos, gastos, neto, count }
}

