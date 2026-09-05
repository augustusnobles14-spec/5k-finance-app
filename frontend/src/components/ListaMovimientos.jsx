import { useEffect, useState } from 'react'
import { listarMovimientos } from '../api/movimientos'

function ListaMovimientos() {
  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMovimientos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listarMovimientos()
      setMovimientos(data || [])
    } catch (err) {
      setError(err.message || 'Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovimientos()
  }, [])

  return (
    <section className="section">
      <div className="section-header">
        <h2>Listado de movimientos</h2>
        <button type="button" onClick={fetchMovimientos} disabled={loading}>
          {loading ? 'Cargando...' : 'Refrescar'}
        </button>
      </div>

      {error ? <p className="error-card">{error}</p> : null}

      <div className="result-card">
        {movimientos.length === 0 ? (
          <p className="muted">No hay movimientos aún.</p>
        ) : (
          <ul>
            {movimientos.map((mov) => (
              <li key={mov.id || `${mov.tipo}-${mov.momento_reg}`}>
                <strong>{mov.tipo}</strong> - {mov.monto} - {mov.categoria} - {mov.descripcion} -{' '}
                {mov.momento_reg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default ListaMovimientos
