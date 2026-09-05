import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import AjustesScreen from "../screens/AjustesScreen";
import MovimientosScreen from "../screens/MovimientosScreen";
import BalanceScreen from "../screens/BalanceScreen";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: true }}>
      <Tab.Screen name="Movimientos" component={MovimientosScreen} />
      <Tab.Screen name="Balance" component={BalanceScreen} />
      <Tab.Screen name="Ajustes" component={AjustesScreen} />
    </Tab.Navigator>
  );
}
