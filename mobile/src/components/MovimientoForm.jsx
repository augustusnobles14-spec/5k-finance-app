import { useState } from 'react'
import { Alert, Text, TextInput, View } from 'react-native'
import PrimaryButton from './PrimaryButton'

export default function MovimientoForm({ tipo, onSubmit, onCancel, loading }) {
  const [monto, setMonto] = useState('')
  const [categoria, setCategoria] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const handleSubmit = () => {
    const montoNumber = Number(monto)
    if (!monto || Number.isNaN(montoNumber) || montoNumber <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un monto mayor a 0')
      return
    }

    onSubmit({
      monto: montoNumber,
      categoria: categoria.trim(),
      descripcion: descripcion.trim(),
      tipo,
    })
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '700' }}>Monto *</Text>
        <TextInput
          placeholder="0"
          keyboardType="numeric"
          value={monto}
          onChangeText={setMonto}
          style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '700' }}>Categoría</Text>
        <TextInput
          placeholder="Ej: Comida, Sueldo"
          value={categoria}
          onChangeText={setCategoria}
          style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
        />
      </View>

      <View style={{ gap: 6 }}>
        <Text style={{ fontWeight: '700' }}>Descripción (opcional)</Text>
        <TextInput
          placeholder="Agrega detalles"
          value={descripcion}
          onChangeText={setDescripcion}
          style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
          multiline
        />
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
        <View style={{ flex: 1 }}>
          <PrimaryButton
            title={loading ? 'Guardando...' : 'Guardar'}
            onPress={handleSubmit}
            disabled={loading}
          />
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton title="Cancelar" onPress={onCancel} disabled={loading} />
        </View>
      </View>
    </View>
  )
}
