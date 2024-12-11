import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';

export default function CustomButton({ label, onPress, variant }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button, 
        variant === 'outline' && styles.outline // Apply outline style conditionally
      ]}
    >
      <Text
        style={[
          styles.buttonText, 
          variant === 'outline' && styles.outlineText // Apply text color based on variant
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6a8a6d', 
    paddingVertical: 12, 
    paddingHorizontal: 15, 
    borderRadius: 10,
    marginBottom: 10,
  },
  outline: {
    backgroundColor: 'white',
    borderColor: 'black', 
    borderWidth: 2, // Add border for outline style
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
    color: 'white', // Default color for button text
  },
  outlineText: {
    color: 'black', // Text color for outline variant
  },
});
