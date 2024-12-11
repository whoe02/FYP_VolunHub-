import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';

export default function InputField({
  label,
  icon,
  inputType,
  keyboardType,
  fieldButtonLabel,
  secureTextEntry,
  fieldButtonFunction,
  onChangeText,
  value,
  editable = true,  // Add editable as a prop with a default value of true
}) {
  const [isFocused, setIsFocused] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
    },
    input: {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'row',
      borderBottomColor: '#ccc',
      borderBottomWidth: 1,
      paddingVertical: 10,
      marginBottom: 10,
    },
    inputFocused: {
      borderColor: '#4CAF50', // Green border when focused
      borderBottomWidth: 2, // Thicker border when focused
    },
  });

  return (
    <View
      style={[styles.input, isFocused && styles.inputFocused]}>
      {icon}
      {inputType == 'password' ? (
        <TextInput
          placeholder={label}
          keyboardType={keyboardType}
          style={{ flex: 1, marginLeft: 10, fontSize: 16 }}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          editable={editable} // Pass editable here
          onFocus={() => setIsFocused(true)}  // Set focus state to true when input is focused
          onBlur={() => setIsFocused(false)}   // Set focus state to false when input loses focus
        />
      ) : (
        <TextInput
          placeholder={label}
          keyboardType={keyboardType}
          style={{ flex: 1, marginLeft: 10, fontSize: 16 }}
          value={value}
          onChangeText={onChangeText}
          editable={editable} // Pass editable here
          onFocus={() => setIsFocused(true)}  // Set focus state to true when input is focused
          onBlur={() => setIsFocused(false)}   // Set focus state to false when input loses focus
        />
      )}
      {fieldButtonLabel && (
        <TouchableOpacity onPress={fieldButtonFunction}>
          <Text style={{ color: '#95c194', fontWeight: '700' }}>{fieldButtonLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}