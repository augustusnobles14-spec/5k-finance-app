import { useState } from 'react'
import "./styles/App.css";
import { api } from "./api/axiosClient";



const prettyJson = (value) => JSON.stringify(value, null, 2)

const normalizeError = (error) => {
  if (error.response) {
    return {
      status: error.response.status,
      message: error.message,
      data: error.response.data,
    }
  }
  if (error.request) {
    return {
      status: null,
      message: 'No se pudo conectar con el backend',
      data: null,
    }
  }
  return {
    status: null,
    message: error.message || 'Error desconocido',
    data: null,
  }
}

function App() {
  const [healthResult, setHealthResult] = useState(null)
  const [healthError, setHealthError] = useState(null)

  const [tipoMov, setTipoMov] = useState('INGRESO')
  const [montoCop, setMontoCop] = useState('')
  const [fecha, setFecha] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [movResult, setMovResult] = useState(null)
  const [movError, setMovError] = useState(null)

  const [diaFecha, setDiaFecha] = useState('')
  const [diaCategoria, setDiaCategoria] = useState('')
  const [diaResult, setDiaResult] = useState(null)
  const [diaError, setDiaError] = useState(null)

  const handleHealthCheck = async () => {
    setHealthResult(null)
    setHealthError(null)
    try {
      const { data } = await api.get('/')
      setHealthResult(data)
    } catch (error) {
      setHealthError(normalizeError(error))
    }
  }

  const handleCreateMovimiento = async (event) => {
    event.preventDefault()
    setMovResult(null)
    setMovError(null)

    const endpoint = tipoMov === 'GASTO' ? '/movimientos/gasto' : '/movimientos/ingreso'
    const payload = {
      monto_cop: Number(montoCop),
      fecha,
      categoria,
      descripcion,
    }

    try {
      const { data } = await api.post(endpoint, payload)
      setMovResult(data)
    } catch (error) {
      setMovError(normalizeError(error))
    }
  }

  const handleResumenDia = async (event) => {
    event?.preventDefault()
    setDiaResult(null)
    setDiaError(null)

    if (!diaFecha) {
      setDiaError({
        status: null,
        message: 'Por favor ingresa la fecha en formato YYYY-MM-DD.',
        data: null,
      })
      return
    }

    const params = { fecha: diaFecha }
    if (diaCategoria) {
      params.categoria = diaCategoria
    }

    try {
      const { data } = await api.get('/resumen/dia', { params })
      setDiaResult(data)
    } catch (error) {
      setDiaError(normalizeError(error))
    }
  }

  const renderResult = (value) =>
    value ? (
      <div className="result-card">
        <pre>{prettyJson(value)}</pre>
      </div>
    ) : null

  const renderError = (error) =>
    error ? (
      <div className="error-card">
        {error.status ? <strong>HTTP {error.status}</strong> : <strong>Error</strong>}
        <div>{error.message}</div>
        {error.data ? <pre>{prettyJson(error.data)}</pre> : null}
      </div>
    ) : null

  return (
    <div className="app-shell">
      <header className="header">
        <div>
          <h1>5K App - Frontend</h1>
          <p className="muted">Pequeña consola para hablar con tu FastAPI local.</p>
        </div>
      </header>

      <section className="section">
        <div className="section-header">
          <h2>Health</h2>
          <button type="button" onClick={handleHealthCheck}>
            Probar Root (/)
          </button>
        </div>
        {renderResult(healthResult)}
        {renderError(healthError)}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Crear Movimiento (POST)</h2>
          <span className="muted">Cambia el tipo para decidir el endpoint</span>
        </div>

        <form id="mov-form" className="form-grid" onSubmit={handleCreateMovimiento}>
          <div className="input-field">
            <label htmlFor="tipo_mov">Tipo de movimiento</label>
            <select
              id="tipo_mov"
              value={tipoMov}
              onChange={(event) => setTipoMov(event.target.value)}
            >
              <option value="INGRESO">INGRESO</option>
              <option value="GASTO">GASTO</option>
            </select>
          </div>

          <div className="input-field">
            <label htmlFor="monto_cop">Monto COP</label>
            <input
              id="monto_cop"
              type="number"
              required
              value={montoCop}
              onChange={(event) => setMontoCop(event.target.value)}
            />
          </div>

          <div className="input-field">
            <label htmlFor="fecha">Fecha (YYYY-MM-DD)</label>
            <input
              id="fecha"
              type="date"
              required
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
            />
          </div>

          <div className="input-field">
            <label htmlFor="categoria">Categoría</label>
            <input
              id="categoria"
              type="text"
              required
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
            />
          </div>

          <div className="input-field">
            <label htmlFor="descripcion">Descripción</label>
            <input
              id="descripcion"
              type="text"
              required
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
            />
          </div>
        </form>

        <div className="actions">
          <button type="submit" form="mov-form">
            Crear
          </button>
        </div>

        {renderResult(movResult)}
        {renderError(movError)}
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Resumen Día (GET)</h2>
          <span className="muted">Query params: fecha y categoría opcional</span>
        </div>

        <form id="dia-form" className="form-grid" onSubmit={handleResumenDia}>
          <div className="input-field">
            <label htmlFor="dia_fecha">Fecha (YYYY-MM-DD)</label>
            <input
              id="dia_fecha"
              type="date"
              required
              value={diaFecha}
              onChange={(event) => setDiaFecha(event.target.value)}
            />
          </div>

          <div className="input-field">
            <label htmlFor="dia_categoria">Categoría (opcional)</label>
            <input
              id="dia_categoria"
              type="text"
              value={diaCategoria}
              onChange={(event) => setDiaCategoria(event.target.value)}
              placeholder="Todas"
            />
          </div>
        </form>

        <div className="actions">
          <button type="submit" form="dia-form">
            Consultar
          </button>
        </div>

        {renderResult(diaResult)}
        {renderError(diaError)}
      </section>
    </div>
  )
}


export default App
