// mobile/src/components/date/dateInput.js
import React from "react"
import { View, Text, TextInput, Platform } from "react-native"
import { formatYYYYMMDD, maskFechaGhost, isFechaCompleta } from "./dateFormat"

const FECHA_INPUT_HEIGHT = 44
const FECHA_FONT_SIZE = 16
const FECHA_FONT = Platform.select({ ios: "Menlo", android: "monospace", default: undefined })

export default function DateInput({
  label,
  value,
  onChange, // (newValue) => void  --> te manda string formateada
  keyboardType = "number-pad",
  maxLength = 10,
  autoCapitalize = "none",
  // hooks de estilo opcionales
  containerStyle,
  labelStyle,
  inputWrapperStyle,
  inputStyle,
  ghostStyle,
}) {
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? <Text style={[{ fontWeight: "700" }, labelStyle]}>{label}</Text> : null}

      <View style={[{ position: "relative" }, inputWrapperStyle]}>
        {!isFechaCompleta(value) && (
          <Text
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                left: 12,
                top: 0,
                height: FECHA_INPUT_HEIGHT,
                lineHeight: FECHA_INPUT_HEIGHT,
                fontSize: FECHA_FONT_SIZE,
                fontFamily: FECHA_FONT,
                color: "#bbb",
              },
              ghostStyle,
            ]}
          >
            {maskFechaGhost(value)}
          </Text>
        )}

        <TextInput
          value={value}
          onChangeText={(t) => onChange(formatYYYYMMDD(t))}
          keyboardType={keyboardType}
          maxLength={maxLength}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          style={[
            {
              borderWidth: 1,
              borderRadius: 10,
              paddingHorizontal: 12,
              height: FECHA_INPUT_HEIGHT,
              fontSize: FECHA_FONT_SIZE,
              fontFamily: FECHA_FONT,
              backgroundColor: "transparent",
            },
            inputStyle,
          ]}
        />
      </View>
    </View>
  )
}
