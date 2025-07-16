import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable form input component with icon and accessibility features
 * 
 * @param {Object} props - Component props
 * @param {string} props.label - Input field label
 * @param {string} props.value - Current input value
 * @param {Function} props.onChangeText - Function to call when text changes
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.iconName - Name of the Ionicons icon to display
 * @param {boolean} props.secureTextEntry - Whether to hide text input (for passwords)
 * @param {Function} props.onToggleSecureEntry - Function to toggle secure entry (for passwords)
 * @param {boolean} props.isSecureTextVisible - Whether secure text is currently visible
 * @param {string} props.keyboardType - Keyboard type to display
 * @param {boolean} props.autoCapitalize - Auto capitalization behavior
 * @param {boolean} props.editable - Whether the input is editable
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 * @param {string} props.accessibilityHint - Accessibility hint for screen readers
 * @param {string} props.textContentType - Content type for autofill
 * @param {string} props.autoCompleteType - Auto-complete type
 */
const FormInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  secureTextEntry = false,
  onToggleSecureEntry,
  isSecureTextVisible,
  keyboardType = 'default',
  autoCapitalize = 'none',
  editable = true,
  accessibilityLabel,
  accessibilityHint,
  textContentType,
  autoCompleteType,
}) => {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWithIcon}>
        <Ionicons name={iconName} size={20} color="#475569" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isSecureTextVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={editable}
          placeholderTextColor="#94a3b8"
          accessible={true}
          accessibilityLabel={accessibilityLabel || label}
          accessibilityHint={accessibilityHint}
          textContentType={textContentType}
          autoCompleteType={autoCompleteType}
        />
        {secureTextEntry && onToggleSecureEntry && (
          <Ionicons
            name={isSecureTextVisible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color="#475569"
            style={styles.visibilityToggle}
            onPress={onToggleSecureEntry}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '600',
    paddingLeft: 2,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    height: 58,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    paddingHorizontal: 14,
    color: '#6b7280',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1f2937',
    paddingVertical: 0,
  },
  visibilityToggle: {
    paddingHorizontal: 14,
    height: '100%',
    paddingVertical: 18,
    color: '#6b7280',
  },
});

export default FormInput;