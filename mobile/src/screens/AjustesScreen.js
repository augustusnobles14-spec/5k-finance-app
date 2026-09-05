import { View, Text } from "react-native";
import Screen from "../components/Screen";
import SectionTitle from "../components/SectionTitle";

export default function AjustesScreen() {
  const items = [
    "Perfil",
    "Seguridad",
    "Moneda (COP)",
    "Categorías",
    "Exportar/Backup",
    "Soporte",
  ];

  return (
    <Screen>
      <SectionTitle>Ajustes</SectionTitle>

      <View style={{ gap: 12 }}>
        {items.map((item) => (
          <View
            key={item}
            style={{ borderWidth: 1, borderRadius: 10, padding: 12 }}
          >
            <Text style={{ fontWeight: "700" }}>{item}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
