import { fetchJson } from './http'

export const getResumenDia = async ({ fecha, categoria }) => {
  return fetchJson('/resumen/dia', { params: { fecha, categoria } })
}

export const getResumenMes = async ({ año, mes, categoria }) => {
  return fetchJson('/resumen/mes', { params: { año, mes, categoria } })
}

export const getResumenRango = async ({ fecha_desde, fecha_hasta, categoria }) => {
  return fetchJson('/resumen/rango', { params: { fecha_desde, fecha_hasta, categoria } })
}
