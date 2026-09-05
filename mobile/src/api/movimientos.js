import { DEFAULT_API_URL, fetchJson } from './http'

export const listarMovimientos = async ({ limit = 10, offset = 0 } = {}) => {
  return fetchJson('/movimientos', { params: { limit, offset } })
}

export const crearMovimiento = async (payload) => {
  return fetchJson('/movimientos', {
    method: 'POST',
    body: payload,
  })
}

export const listarMovimientosRango = async ({
  fecha_desde,
  fecha_hasta,
  categoria,
  tipo_mov, // "INGRESO" | "GASTO" | undefined
} = {}) => {
  const params = { fecha_desde, fecha_hasta };

  if (categoria && categoria.trim()) params.categoria = categoria.trim();
  if (tipo_mov) params.tipo_mov = tipo_mov;

  return fetchJson('/movimientos/rango', { params });
};
