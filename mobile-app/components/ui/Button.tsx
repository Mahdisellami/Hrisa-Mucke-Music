/**
 * Button Components
 *
 * Reusable button library matching Settings screen aesthetic.
 * Provides Primary, Secondary, Danger, Icon, and Pill button variants.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Icon, IconName } from './Icon';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  TouchTargets,
} from '@/constants/DesignTokens';

// Base button props
interface BaseButtonProps {
  title?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

/**
 * Primary Button
 * Green background, main call-to-action
 */
export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: BaseButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.primaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text.primary} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size="sm" color={Colors.text.primary} style={styles.iconLeft} />
          )}
          {title && (
            <Text style={[styles.primaryButtonText, textStyle]}>{title}</Text>
          )}
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size="sm" color={Colors.text.primary} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Secondary Button
 * Gray background, secondary actions
 */
export function SecondaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: BaseButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.secondaryButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text.primary} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size="sm" color={Colors.text.primary} style={styles.iconLeft} />
          )}
          {title && (
            <Text style={[styles.secondaryButtonText, textStyle]}>{title}</Text>
          )}
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size="sm" color={Colors.text.primary} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

/**
 * Danger Button
 * Red background, destructive actions
 */
export function DangerButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: BaseButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.dangerButton,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={Colors.text.primary} />
      ) : (
        <View style={styles.buttonContent}>
          {icon && iconPosition === 'left' && (
            <Icon name={icon} size="sm" color={Colors.text.primary} style={styles.iconLeft} />
          )}
          {title && (
            <Text style={[styles.dangerButtonText, textStyle]}>{title}</Text>
          )}
          {icon && iconPosition === 'right' && (
            <Icon name={icon} size="sm" color={Colors.text.primary} style={styles.iconRight} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Icon button props
interface IconButtonProps {
  icon: IconName;
  size?: 'sm' | 'md' | 'lg';
  onPress: () => void;
  active?: boolean;
  color?: string;
  activeColor?: string;
  disabled?: boolean;
  badge?: number | string;
  style?: ViewStyle;
}

/**
 * Icon Button
 * Icon-only button with transparent background
 */
export function IconButton({
  icon,
  size = 'md',
  onPress,
  active = false,
  color,
  activeColor = Colors.accent.primary,
  disabled = false,
  badge,
  style,
}: IconButtonProps) {
  const iconColor = active
    ? activeColor
    : color || Colors.text.secondary;

  const touchSize =
    size === 'sm' ? TouchTargets.small :
    size === 'lg' ? TouchTargets.large :
    TouchTargets.medium;

  const iconSizeMap = {
    sm: 20,
    md: 24,
    lg: 32,
  };

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { width: touchSize, height: touchSize },
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Icon name={icon} size={iconSizeMap[size]} color={iconColor} />
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// Pill button props
interface PillButtonProps {
  title: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Pill Button
 * Pill-shaped toggle button (used for EQ presets, speed settings)
 */
export function PillButton({
  title,
  onPress,
  active = false,
  disabled = false,
  style,
}: PillButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.pillButton,
        active && styles.pillButtonActive,
        disabled && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.pillButtonText,
          active && styles.pillButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Primary Button
  primaryButton: {
    backgroundColor: Colors.accent.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: Colors.interactive.secondary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Danger Button
  dangerButton: {
    backgroundColor: Colors.accent.danger,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: TouchTargets.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: Colors.text.primary,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold,
  },

  // Icon Button
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  // Badge (for IconButton)
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: Colors.text.primary,
    fontSize: 10,
    fontWeight: Typography.fontWeight.bold,
  },

  // Pill Button
  pillButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.background.card,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillButtonActive: {
    backgroundColor: Colors.accent.primary,
  },
  pillButtonText: {
    color: Colors.text.tertiary,
    fontSize: Typography.fontSize.bodySmall,
    fontWeight: Typography.fontWeight.semibold,
  },
  pillButtonTextActive: {
    color: Colors.text.primary,
  },

  // Shared
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  disabledButton: {
    opacity: 0.5,
  },
});
