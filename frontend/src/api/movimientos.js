import { api } from './axiosClient'

export const crearMovimiento = async (payload) => {
  try {
    const response = await api.post('/movimientos', payload)
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message || 'No se pudo crear el movimiento'
    throw new Error(message)
  }
}

export const listarMovimientos = async () => {
  try {
    const response = await api.get('/movimientos')
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message || 'No se pudo obtener los movimientos'
    throw new Error(message)
  }
}

export const listarMovimientosRango = async (params) => {
  try {
    const response = await api.get('/movimientos/rango', { params })
    return response.data.data
  } catch (error) {
    const message =
      error.response?.data?.message || 'No se pudo obtener los movimientos del rango'
    throw new Error(message)
  }
}
