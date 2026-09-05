import { useState } from 'react'
import { crearMovimiento } from '../api/movimientos'

const initialForm = {
  tipo: 'INGRESO',
  monto: '',
  descripcion: '',
  categoria: '',
}

function CrearMovimientos() {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const payload = {
        ...form,
        monto: Number(form.monto),
      }

      const result = await crearMovimiento(payload)
      setSuccess('Movimiento creado con éxito')
      setForm(initialForm)
      return result
    } catch (err) {
      setError(err.message || 'Error al crear el movimiento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2>Crear Movimiento</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="tipo">Tipo</label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            disabled={loading}
          >
            <option value="INGRESO">INGRESO</option>
            <option value="GASTO">GASTO</option>
          </select>
        </div>

        <div>
          <label htmlFor="monto">Monto</label>
          <input
            id="monto"
            name="monto"
            type="number"
            required
            value={form.monto}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="descripcion">Descripción</label>
          <input
            id="descripcion"
            name="descripcion"
            type="text"
            required
            value={form.descripcion}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="categoria">Categoría</label>
          <input
            id="categoria"
            name="categoria"
            type="text"
            value={form.categoria}
            onChange={handleChange}
            disabled={loading}
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear'}
        </button>
      </form>

      {success ? <p>{success}</p> : null}
      {error ? <p>{error}</p> : null}
    </div>
  )
}

export default CrearMovimientos
