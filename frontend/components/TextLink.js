import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

/**
 * Reusable text link component with accessibility features
 * 
 * @param {Object} props - Component props
 * @param {string} props.text - Link text
 * @param {Function} props.onPress - Function to call when link is pressed
 * @param {boolean} props.disabled - Whether link is disabled
 * @param {string} props.accessibilityLabel - Accessibility label for screen readers
 * @param {string} props.accessibilityHint - Accessibility hint for screen readers
 * @param {Object} props.style - Additional styles for the link container
 * @param {Object} props.textStyle - Additional styles for the link text
 */
const TextLink = ({
  text,
  onPress,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.link, style]}
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityLabel={accessibilityLabel || text}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
    >
      <Text style={[styles.linkText, textStyle]}>{text}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  link: {
    paddingVertical: 4, // Add padding for better touch target
  },
  linkText: {
    color: '#0ea5e9',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default TextLink;