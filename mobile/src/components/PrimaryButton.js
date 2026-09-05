import { Pressable, Text } from 'react-native'

export default function PrimaryButton({ title, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
        borderWidth: 1,
      }}
    >
      <Text style={{ fontWeight: '700' }}>{title}</Text>
    </Pressable>
  )
}
