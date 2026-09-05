import { SafeAreaView, View } from 'react-native'

export default function Screen({ children }) {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16 }}>{children}</View>
    </SafeAreaView>
  )
}
