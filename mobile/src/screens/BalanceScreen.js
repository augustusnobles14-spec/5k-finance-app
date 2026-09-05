import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View, Keyboard, TouchableWithoutFeedback} from 'react-native'
import Screen from '../components/Screen'
import SectionTitle from '../components/SectionTitle'
import PrimaryButton from '../components/PrimaryButton'
import { getResumenDia, getResumenMes, getResumenRango } from '../api/resumen'
import { formatLocalYyyyMmDd, getLocalRangeFromInputs } from '../utils/balanceSummary'
import { consumeBalanceNeedsRefresh } from '../state/refreshFlags'
import { useFocusEffect } from '@react-navigation/native'
import { DateInput } from '../components/date'

const MODOS = ['Día', 'Mes', 'Rango']

export default function BalanceScreen() {
  const [modo, setModo] = useState('Día')
  const modoRef = useRef(modo)

useEffect(() => {
  modoRef.current = modo
}, [modo])

  const [loading, setLoading] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [resumen, setResumen] = useState({ ingresos: 0, gastos: 0, neto: 0 })
  const cacheRef = useRef({})
  const [lastRangeKey, setLastRangeKey] = useState(null)
  const inFlightDayRef = useRef(null)
  const inFlightMonthRef = useRef(null)
  const inFlightRefreshBothRef = useRef(null)
  const didWarmRef = useRef(false)
  

  const todayStr = useMemo(() => formatLocalYyyyMmDd(new Date()), [])
  const dayCacheKey = useMemo(() => `dia:${todayStr}`, [todayStr])
  const monthCacheKey = useMemo(() => {
    const today = new Date()
    return `mes:${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  }, [])
  const [desdeStr, setDesdeStr] = useState(todayStr)
  const [hastaStr, setHastaStr] = useState(todayStr)

  const mapResumen = useCallback(
    (data) => ({
      ingresos: Number(data?.total_ingresos) || 0,
      gastos: Number(data?.total_gastos) || 0,
      neto: Number(data?.balance) || 0,
    }),
    []
  )

  const setCache = (key, value) => {
    cacheRef.current[key] = value
  }

  const setModoSafe = useCallback(
    (nextModo) => {
      setModo(nextModo)
      if (nextModo === 'Día' && cacheRef.current[dayCacheKey]) {
        setResumen(cacheRef.current[dayCacheKey])
        return
      }
      if (nextModo === 'Mes' && cacheRef.current[monthCacheKey]) {
        setResumen(cacheRef.current[monthCacheKey])
        return
      }
      if (nextModo === 'Rango' && lastRangeKey && cacheRef.current[lastRangeKey]) {
        setResumen(cacheRef.current[lastRangeKey])
      }
    },
    [dayCacheKey, monthCacheKey, lastRangeKey]
  )

  const fetchDiaDedup = useCallback(
    async ({ silent = false, useLoading = true } = {}) => {
      if (inFlightDayRef.current) return inFlightDayRef.current
      const run = (async () => {
        if (useLoading) setLoading(true)
        try {
          const data = await getResumenDia({ fecha: todayStr })
          const mapped = mapResumen(data)
          setCache(dayCacheKey, mapped)
          if (modoRef.current === 'Día') {
            setResumen(mapped)
          }
        } catch (err) {
          if (!silent) Alert.alert('Error', err.message || 'No se pudo obtener el resumen')
        } finally {
          setHasLoadedOnce(true)
          if (useLoading) setLoading(false)
          inFlightDayRef.current = null
        }
      })()
      inFlightDayRef.current = run
      return run
    },
    [dayCacheKey, mapResumen, todayStr]
  )

  const fetchMesDedup = useCallback(
    async ({ silent = false, useLoading = true } = {}) => {
      if (inFlightMonthRef.current) return inFlightMonthRef.current
      const run = (async () => {
        if (useLoading) setLoading(true)
        try {
          const today = new Date()
          const data = await getResumenMes({ año: today.getFullYear(), mes: today.getMonth() + 1 })
          const mapped = mapResumen(data)
          setCache(monthCacheKey, mapped)
          if (modoRef.current === 'Mes') {
            setResumen(mapped)
          }
        } catch (err) {
          if (!silent) Alert.alert('Error', err.message || 'No se pudo obtener el resumen')
        } finally {
          setHasLoadedOnce(true)
          if (useLoading) setLoading(false)
          inFlightMonthRef.current = null
        }
      })()
      inFlightMonthRef.current = run
      return run
    },
    [mapResumen, monthCacheKey]
  )

  const fetchResumenRango = async ({ fechaDesde, fechaHasta }) => {
    setLoading(true)
    try {
      const data = await getResumenRango({ fecha_desde: fechaDesde, fecha_hasta: fechaHasta })
      const mapped = mapResumen(data)
      const key = `rango:${fechaDesde}|${fechaHasta}`
      setLastRangeKey(key)
      setCache(key, mapped)
      setResumen(mapped)
    } catch (err) {
      Alert.alert('Error', err.message || 'No se pudo obtener el resumen')
    } finally {
      setHasLoadedOnce(true)
      setLoading(false)
    }
  }

  useEffect(() => {
  if (didWarmRef.current) return
  didWarmRef.current = true

  Promise.all([
    fetchDiaDedup({ silent: true }),
    fetchMesDedup({ silent: true }),
  ])
}, [fetchDiaDedup, fetchMesDedup])


  const isEmpty = resumen.ingresos === 0 && resumen.gastos === 0 && resumen.neto === 0
  const diaReady = !!cacheRef.current[dayCacheKey]
  const mesReady = !!cacheRef.current[monthCacheKey]
  const modoReady = modo === 'Día' ? diaReady : modo === 'Mes' ? mesReady : true

  const resumenVisible = modoReady ? resumen : { ingresos: null, gastos: null, neto: null }



  const formatMoney = (value) => {
    if (value === null || value === undefined) return '—'
    const n = Number(value) || 0
    try {
      return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n)
    } catch (_e) {
      return String(Math.round(n))
    }
  }

  const onConsultarRango = () => {
  Keyboard.dismiss()

  const next = getLocalRangeFromInputs(desdeStr, hastaStr)
  if (next.error) {
    Alert.alert('Rango inválido', next.error)
    return
  }
  fetchResumenRango({ fechaDesde: desdeStr, fechaHasta: hastaStr })
}


  const onActualizar = useCallback(() => {
    if (loading) return
    if (modo === 'Día') {
      fetchDiaDedup()
      return
    }
    if (modo === 'Mes') {
      fetchMesDedup()
      return
    }
    if (modo === 'Rango') {
      const next = getLocalRangeFromInputs(desdeStr, hastaStr)
      if (next.error) {
        Alert.alert('Rango inválido', next.error)
        return
      }
      fetchResumenRango({ fechaDesde: desdeStr, fechaHasta: hastaStr })
    }
  }, [loading, modo, desdeStr, hastaStr, fetchDiaDedup, fetchMesDedup])

  useFocusEffect(
  useCallback(() => {
    const shouldRefresh = consumeBalanceNeedsRefresh()
    if (!shouldRefresh) return
    if (inFlightRefreshBothRef.current) return

    const run = Promise.all([
      fetchDiaDedup({ silent: true, useLoading: false }),
      fetchMesDedup({ silent: true, useLoading: false }),
    ]).finally(() => {
      inFlightRefreshBothRef.current = null
    })

    inFlightRefreshBothRef.current = run
  }, [fetchDiaDedup, fetchMesDedup])
)


  const renderValueCard = ({ title, value, subtitle, valueColor }) => (
    <View style={{ borderWidth: 1, borderRadius: 12, padding: 14, gap: 6 }}>
      <Text style={{ fontWeight: '700', color: '#333' }}>{title}</Text>
      <Text style={{ fontSize: 28, fontWeight: '800', color: valueColor || '#111' }}>${formatMoney(value)}</Text>
      {subtitle ? <Text style={{ color: '#666' }}>{subtitle}</Text> : null}
    </View>
  )

  return (
    <Screen>
       <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={{ flex: 1 }}>
          <SectionTitle>Balance</SectionTitle>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
        {MODOS.map((m) => (
          <Pressable
            key={m}
            onPress={() => setModoSafe(m)}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 12,
              flex: 1,
              borderRadius: 10,
              borderWidth: 1,
              backgroundColor: modo === m ? '#111' : 'transparent',
              opacity: modo === m ? 1 : 0.75,
            }}
          >
            <Text style={{ fontWeight: '800', textAlign: 'center', color: modo === m ? '#fff' : '#111' }}>{m}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginBottom: 14, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: '#555' }}>
            {modo === 'Día'
              ? `Hoy (${formatLocalYyyyMmDd(new Date())})`
              : modo === 'Mes'
                ? `Este mes (${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')})`
                : 'Selecciona un rango'}
          </Text>
          {(loading || (!modoReady && hasLoadedOnce)) ? <ActivityIndicator /> : null}

        </View>

        {modo === 'Rango' ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <DateInput
                label="Desde"
                value={desdeStr}
                onChange={setDesdeStr}
                containerStyle={{ flex: 1 }}
              />
              <DateInput
                label="Hasta"
                value={hastaStr}
                onChange={setHastaStr}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <PrimaryButton title="Consultar" onPress={onConsultarRango} disabled={loading} />
          </View>
        ) : null}
      </View>

      <View style={{ gap: 10 }}>
        {renderValueCard({
          title: 'Ingresos',
          value: resumenVisible.ingresos,
          subtitle: isEmpty && hasLoadedOnce && !loading ? 'Sin movimientos en el periodo' : null,
          valueColor: '#0b7',
        })}
        {renderValueCard({
          title: 'Gastos',
          value: resumenVisible.gastos,
          subtitle: null,
          valueColor: '#d33',
        })}
        {renderValueCard({
          title: 'Balance neto',
          value: resumenVisible.neto,
          subtitle: null,
          valueColor:
            resumenVisible.neto === null || resumenVisible.neto === undefined
              ? '#111'
              : resumenVisible.neto >= 0
                ? '#0b7'
              : '#d33',

        })}
      </View>
      <View style={{ marginTop: 14 }}>
        <PrimaryButton
          title={loading ? 'Actualizando...' : 'Actualizar'}
          onPress={onActualizar}
          disabled={loading}
        />
      </View>
    </View>
  </TouchableWithoutFeedback>
</Screen>
)
}
