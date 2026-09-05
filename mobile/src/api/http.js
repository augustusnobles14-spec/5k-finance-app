export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.10.34.229:8000'

const parseErrorMessage = async (response) => {
  try {
    const json = await response.json()
    return (
      json?.message ||
      json?.detail?.message ||
      (typeof json?.detail === 'string' ? json.detail : null) ||
      'Error al comunicarse con el servidor'
    )
  } catch (_e) {
    return 'Error al comunicarse con el servidor'
  }
}

export async function fetchJson(path, { method = 'GET', params, body, headers, timeoutMs = 10000 } = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const searchParams = new URLSearchParams()
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value)
        }
      })
    }

    const query = searchParams.toString()
    const url = query ? `${DEFAULT_API_URL}${path}?${query}` : `${DEFAULT_API_URL}${path}`

    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(headers || {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const message = await parseErrorMessage(res)
      throw new Error(message)
    }

    const json = await res.json()
    if (json && Object.prototype.hasOwnProperty.call(json, 'data')) {
      return json.data
    }
    return json
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado')
    }
    throw err
  } finally {
    clearTimeout(timeout)
  }
}
