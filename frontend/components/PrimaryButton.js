import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Reusable primary button component with loading state and icon support
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Button text
 * @param {Function} props.onPress - Function to call when button is pressed
 * @param {boolean} props.isLoading - Whether to show loading indicator
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {string} props.iconName - Name of the Ionicons icon to display
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 * @param {string} props.accessibilityHint - Accessibility hint for screen readers
 * @param {Object} props.style - Additional styles for the button
 */
const PrimaryButton = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  iconName,
  accessibilityLabel,
  accessibilityHint,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        (isLoading || disabled) && styles.buttonDisabled,
        style
      ]}
      onPress={onPress}
      disabled={isLoading || disabled}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading || disabled }}
      accessibilityHint={accessibilityHint}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>{title}</Text>
          {iconName && (
            <Ionicons name={iconName} size={20} color="#fff" style={styles.buttonIcon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 14,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#a5b4fc',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 10,
  },
});

export default PrimaryButton;