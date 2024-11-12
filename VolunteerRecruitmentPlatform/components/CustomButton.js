import { Text, TouchableOpacity } from 'react-native';
import React from 'react';

export default function CustomButton({ label, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: '#6a8a6d',
        paddingVertical: 8, 
        paddingHorizontal: 15, 
        borderRadius: 10,
        marginBottom: 30,
      }}
    >
      <Text
        style={{
          textAlign: 'center',
          fontWeight: '700',
          fontSize: 16,
          color: 'white',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
