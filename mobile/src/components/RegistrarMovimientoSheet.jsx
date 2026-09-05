import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import MovimientoForm from './MovimientoForm'
import { crearMovimiento } from '../api/movimientos'
import { markBalanceNeedsRefresh } from '../state/refreshFlags'

export default function RegistrarMovimientoSheet({ visible, tipo, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)

  const handleGuardar = async (payload) => {
    setLoading(true)
    try {
      await crearMovimiento({
        tipo: payload.tipo,
        monto: payload.monto,
        categoria: payload.categoria,
        descripcion: payload.descripcion,
        momento_reg: new Date().toISOString(),
      })
      markBalanceNeedsRefresh()
      Alert.alert('Listo', 'Movimiento registrado')
      onClose()
      onSaved?.()
    } catch (err) {
      const message = err?.message || 'No se pudo guardar'
      Alert.alert('Error', message)
    } finally {
      setLoading(false)
    }
  }

  const title = tipo === 'ingreso' ? 'Registrar ingreso' : 'Registrar gasto'

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <View
            style={{
              backgroundColor: '#fff',
              padding: 16,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              gap: 14,
              maxHeight: '90%',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>{title}</Text>
              <Pressable onPress={onClose} style={{ padding: 8 }}>
                <Text style={{ fontWeight: '700' }}>Cerrar</Text>
              </Pressable>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              <MovimientoForm tipo={tipo} onSubmit={handleGuardar} onCancel={onClose} loading={loading} />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
