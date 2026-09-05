import { api } from './axiosClient'

export const obtenerResumenDia = async (params) => {
  try {
    const response = await api.get('/resumen/dia', { params })
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message || 'No se pudo obtener el resumen del día'
    throw new Error(message)
  }
}

export const obtenerResumenMes = async (params) => {
  try {
    const response = await api.get('/resumen/mes', { params })
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message || 'No se pudo obtener el resumen del mes'
    throw new Error(message)
  }
}

export const obtenerResumenRango = async (params) => {
  try {
    const response = await api.get('/resumen/rango', { params })
    return response.data.data
  } catch (error) {
    const message = error.response?.data?.message || 'No se pudo obtener el resumen del rango'
    throw new Error(message)
  }
}
