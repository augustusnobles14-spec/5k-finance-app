import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View, Keyboard, KeyboardAvoidingView, TouchableWithoutFeedback, Platform } from "react-native";
import Screen from "../components/Screen";
import SectionTitle from "../components/SectionTitle";
import RegistrarMovimientoSheet from "../components/RegistrarMovimientoSheet";
import { listarMovimientos, listarMovimientosRango } from "../api/movimientos";
import { DateInput, formatFechaDia, formatFechaHora, hoyStr } from "../components/date";


const MODOS = ["Recientes", "Rango"];


export default function MovimientosScreen() {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [tipoActual, setTipoActual] = useState("ingreso");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [modoVista, setModoVista] = useState("Recientes"); // "Recientes" | "Rango"

  // Rango fechas predeterminados fecha actual

  const [desdeStr, setDesdeStr] = useState(hoyStr);
  const [hastaStr, setHastaStr] = useState(hoyStr);

  const [tipoFiltro, setTipoFiltro] = useState("TODOS"); // "TODOS" | "INGRESO" | "GASTO"
  const [categoriaFiltro, setCategoriaFiltro] = useState("");

  const [movimientosRango, setMovimientosRango] = useState([]);
  const [loadingRango, setLoadingRango] = useState(false);
  const [errorRango, setErrorRango] = useState(null);
  const [hasConsultadoRango, setHasConsultadoRango] = useState(false);

  const fetchMovimientos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarMovimientos({ limit: 10, offset: 0 });
      setMovimientos(data || []);
    } catch (err) {
      setError(err.message || "No se pudo obtener los movimientos");
    } finally {
      setHasLoadedOnce(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimientos();
  }, []);

  const abrirSheet = (tipo) => {
    setTipoActual(tipo);
    setSheetVisible(true);
  };

  const onConsultarRango = async() => {
    Keyboard.dismiss();
    setHasConsultadoRango(true);
    setErrorRango(null);

    if (!desdeStr || !hastaStr) {
    setErrorRango("Debes llenar Desde y Hasta (YYYY-MM-DD).");
      return;
  }

    setLoadingRango(true);
    try {
      const tipoParam = tipoFiltro === "TODOS" ? undefined : tipoFiltro;

      const data = await listarMovimientosRango({
        fecha_desde: desdeStr,
        fecha_hasta: hastaStr,
        categoria: categoriaFiltro,
        tipo_mov: tipoParam,
    });

    setMovimientosRango(data || []);
  } catch (err) {
    setErrorRango(err.message || "No se pudo consultar el rango");
  } finally {
    setLoadingRango(false);
  }
};


  const renderItem = ({ item }) => (
    <View style={{ borderWidth: 1, borderRadius: 10, padding: 12, gap: 4, marginBottom: 10 }}>
      <Text style={{ fontWeight: "700" }}>{item.tipo === "INGRESO" ? "Ingreso" : "Gasto"}</Text>
      <Text style={{ fontSize: 18, fontWeight: "700" }}>${item.monto}</Text>
      <Text style={{ color: "#444" }}>{formatFechaDia(item.fecha)}</Text>
      {item.categoria ? <Text style={{ fontWeight: "600" }}>Categoría: {item.categoria}</Text> : null}
      {item.descripcion ? <Text style={{ color: "#555" }}>{item.descripcion}</Text> : null}
      <Text style={{ color: "#888", fontSize: 11 }}>Registrado {formatFechaHora(item.momento_reg)}</Text>
    </View>
  );
  const renderItemRango = ({ item }) => (
  <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: "#ddd" }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={{ fontWeight: "700" }}>
        {item.tipo_mov === "INGRESO" ? "Ingreso" : "Gasto"}
      </Text>

      <Text style={{ fontWeight: "800" }}>
        ${item.monto_cop}
      </Text>
    </View>

    <Text style={{ color: "#444" }}>{formatFechaDia(item.fecha)}</Text>

    {item.categoria ? (
      <Text style={{ color: "#555" }}>Categoría: {item.categoria}</Text>
    ) : null}

    {item.descripcion ? (
      <Text style={{ color: "#666" }}>{item.descripcion}</Text>
    ) : null}

    <Text style={{ fontSize: 11, color: "#888" }}>
      Registrado {formatFechaHora(item.momento_reg)}
    </Text>
  </View>
);


 return (
  <Screen>
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 10 }}>
          Bienvenido
        </Text>

        {/* Botones registrar */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          <Pressable
            onPress={() => abrirSheet("ingreso")}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              flex: 1,
            }}
          >
            <Text style={{ fontWeight: "700", textAlign: "center" }}>
              Registrar ingreso
            </Text>
          </Pressable>

          <Pressable
            onPress={() => abrirSheet("gasto")}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderRadius: 10,
              borderWidth: 1,
              flex: 1,
            }}
          >
            <Text style={{ fontWeight: "700", textAlign: "center" }}>
              Registrar gasto
            </Text>
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {MODOS.map((m) => (
            <Pressable
              key={m}
              onPress={() => setModoVista(m)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 12,
                flex: 1,
                borderRadius: 10,
                borderWidth: 1,
                backgroundColor: modoVista === m ? "#111" : "transparent",
                opacity: modoVista === m ? 1 : 0.75,
              }}
            >
              <Text
                style={{
                  fontWeight: "800",
                  textAlign: "center",
                  color: modoVista === m ? "#fff" : "#111",
                }}
              >
                {m}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ===== RECENTES / RANGO ===== */}
        {modoVista === "Recientes" ? (
          <>
            <SectionTitle>Últimos movimientos</SectionTitle>

            {error ? (
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "red" }}>{error}</Text>
              </View>
            ) : null}

            {loading ? (
              <View style={{ padding: 20 }}>
                <ActivityIndicator />
              </View>
            ) : !error && hasLoadedOnce && movimientos.length === 0 ? (
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text>No hay movimientos aún</Text>
              </View>
            ) : (
              <FlatList
                data={movimientos}
                keyExtractor={(item, index) =>
                  String(item.id_mov || item.ID_mov || index)
                }
                renderItem={renderItem}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
              />
            )}

            <View style={{ marginTop: 10 }}>
              <Pressable
                onPress={fetchMovimientos}
                disabled={loading}
                style={{
                  paddingVertical: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  alignItems: "center",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                <Text style={{ fontWeight: "700" }}>
                  {loading ? "Actualizando..." : "Actualizar lista"}
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
            {/* ===== RANGO ===== */}
            <SectionTitle>Movimientos por rango</SectionTitle>

            {errorRango ? (
              <View
                style={{
                  borderWidth: 1,
                  borderRadius: 10,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "red" }}>{errorRango}</Text>
              </View>
            ) : null}

            <FlatList
              data={
                loadingRango ||
                (hasConsultadoRango && movimientosRango.length === 0)
                  ? []
                  : movimientosRango
              }
              keyExtractor={(item, index) =>
                String(item.id_mov || item.ID_mov || index)
              }
              renderItem={renderItemRango}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="on-drag"
              onScrollBeginDrag={Keyboard.dismiss}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                <View
                  style={{
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 12,
                    gap: 10,
                    marginBottom: 12,
                  }}
                >
                  {/* Filtros */}
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <DateInput
                      label="Desde"
                      value={desdeStr}
                      onChange={setDesdeStr}
                      containerStyle={{ flex: 1, gap: 6 }}
                    />
                    <DateInput
                      label="Hasta"
                      value={hastaStr}
                      onChange={setHastaStr}
                      containerStyle={{ flex: 1, gap: 6 }}
                    />
                  </View>

                  {/* Tipo */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "700" }}>Tipo</Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      {["TODOS", "INGRESO", "GASTO"].map((t) => (
                        <Pressable
                          key={t}
                          onPress={() => {
                            Keyboard.dismiss()
                            setTipoFiltro(t)
                          }}
                          style={{
                            paddingVertical: 10,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                            borderWidth: 1,
                            backgroundColor:
                              tipoFiltro === t ? "#111" : "transparent",
                            opacity: tipoFiltro === t ? 1 : 0.75,
                            flex: 1,
                          }}
                        >
                          <Text
                            style={{
                              textAlign: "center",
                              fontWeight: "800",
                              color: tipoFiltro === t ? "#fff" : "#111",
                            }}
                          >
                            {t === "TODOS"
                              ? "Todos"
                              : t === "INGRESO"
                              ? "Ingreso"
                              : "Gasto"}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Categoría */}
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontWeight: "700" }}>
                      Categoría (opcional)
                    </Text>
                    <TextInput
                      placeholder="Ej: Comida, Transporte..."
                      value={categoriaFiltro}
                      onChangeText={setCategoriaFiltro}
                      autoCapitalize="none"
                      style={{
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 12,
                      }}
                    />
                  </View>

                  {/* Botón consultar */}
                  <Pressable
                    onPress={() => {
                      Keyboard.dismiss()
                      onConsultarRango()
                    }}
                    disabled={loadingRango}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 10,
                      borderWidth: 1,
                      alignItems: "center",
                      opacity: loadingRango ? 0.7 : 1,
                    }}
                  >
                    <Text style={{ fontWeight: "800" }}>
                      {loadingRango ? "Consultando..." : "Consultar"}
                    </Text>
                  </Pressable>

                  {/* Estados */}
                  {loadingRango ? (
                    <View style={{ paddingTop: 10 }}>
                      <ActivityIndicator />
                    </View>
                  ) : hasConsultadoRango &&
                    movimientosRango.length === 0 ? (
                    <View
                      style={{
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 12,
                        marginTop: 10,
                      }}
                    >
                      <Text>Sin movimientos en este rango</Text>
                    </View>
                  ) : null}
                </View>
              }
              contentContainerStyle={{ paddingBottom: 180 }}
            />
          </>
        )}

        {/* Sheet */}
        <RegistrarMovimientoSheet
          visible={sheetVisible}
          tipo={tipoActual}
          onClose={() => setSheetVisible(false)}
          onSaved={fetchMovimientos}
        />
      </View>
    </KeyboardAvoidingView>
  </Screen>
);
}
