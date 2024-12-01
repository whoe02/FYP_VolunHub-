import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';

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
  return (
    <View
      style={{
        flexDirection: 'row',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        paddingBottom: 8,
        marginBottom: 25,
      }}>
      {icon}
      {inputType == 'password' ? (
        <TextInput
          placeholder={label}
          keyboardType={keyboardType}
          style={{ flex: 1, paddingVertical: 0, marginLeft: 10, fontSize: 16 }}
          secureTextEntry={secureTextEntry}
          value={value}
          onChangeText={onChangeText}
          editable={editable} // Pass editable here
        />
      ) : (
        <TextInput
          placeholder={label}
          keyboardType={keyboardType}
          style={{ flex: 1, paddingVertical: 0, marginLeft: 10, fontSize: 16 }}
          value={value}
          onChangeText={onChangeText}
          editable={editable} // Pass editable here
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