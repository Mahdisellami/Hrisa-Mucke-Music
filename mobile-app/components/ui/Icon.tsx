/**
 * Icon Component
 *
 * Unified icon system using Expo Vector Icons (Ionicons).
 * Replaces all emoji icons throughout the app for a professional look.
 */

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { IconSizes, Colors } from '@/constants/DesignTokens';

// Comprehensive icon name type based on Ionicons
export type IconName =
  // Playback controls
  | 'play'
  | 'pause'
  | 'stop'
  | 'play-skip-forward'
  | 'play-skip-back'
  | 'play-forward'
  | 'play-back'
  | 'play-circle'
  | 'play-circle-outline'

  // Navigation
  | 'arrow-back'
  | 'arrow-forward'
  | 'chevron-back'
  | 'chevron-forward'
  | 'chevron-down'
  | 'chevron-up'
  | 'close'

  // Actions
  | 'heart'
  | 'heart-outline'
  | 'add'
  | 'add-circle'
  | 'add-circle-outline'
  | 'remove'
  | 'remove-circle'
  | 'trash'
  | 'trash-outline'
  | 'create'
  | 'create-outline'
  | 'share'
  | 'share-outline'
  | 'share-social'
  | 'download'
  | 'download-outline'

  // Media & Music
  | 'musical-note'
  | 'musical-notes'
  | 'list'
  | 'list-outline'
  | 'shuffle'
  | 'shuffle-outline'
  | 'repeat'
  | 'repeat-outline'
  | 'albums'
  | 'disc'

  // Volume
  | 'volume-high'
  | 'volume-low'
  | 'volume-medium'
  | 'volume-mute'
  | 'volume-off'

  // Search & Info
  | 'search'
  | 'search-outline'
  | 'information-circle'
  | 'information-circle-outline'
  | 'help-circle'
  | 'help-circle-outline'

  // Status & Feedback
  | 'checkmark'
  | 'checkmark-circle'
  | 'checkmark-done'
  | 'close-circle'
  | 'alert-circle'
  | 'warning'
  | 'ellipse'
  | 'ellipse-outline'

  // Documents & Text
  | 'document'
  | 'document-text'
  | 'document-outline'
  | 'text'

  // System & Settings
  | 'settings'
  | 'settings-outline'
  | 'cog'
  | 'cog-outline'
  | 'server'
  | 'server-outline'
  | 'wifi'
  | 'wifi-outline'

  // Reorder & Move
  | 'swap-vertical'
  | 'reorder-two'
  | 'reorder-four'
  | 'move'

  // Time
  | 'time'
  | 'time-outline'
  | 'timer'
  | 'timer-outline'

  // More
  | 'ellipsis-horizontal'
  | 'ellipsis-vertical'
  | 'menu'
  | 'menu-outline'

  // People
  | 'person'
  | 'person-outline'
  | 'person-circle'
  | 'person-circle-outline'
  | 'person-add'
  | 'person-add-outline'
  | 'people'
  | 'people-outline'

  // Special
  | 'sparkles'
  | 'sparkles-outline'
  | 'star'
  | 'star-outline';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: string;
  style?: any;
}

/**
 * Icon component using Ionicons
 *
 * @example
 * <Icon name="play" size="md" color={Colors.accent.primary} />
 * <Icon name="heart" size={24} color="#ff0000" />
 */
export function Icon({
  name,
  size = 'md',
  color = Colors.text.primary,
  style
}: IconProps) {
  // Convert size string to number
  const iconSize = typeof size === 'number' ? size : IconSizes[size];

  return (
    <Ionicons
      name={name}
      size={iconSize}
      color={color}
      style={style}
    />
  );
}

/**
 * Helper function to get repeat icon name based on mode
 */
export function getRepeatIconName(mode: 'off' | 'one' | 'all'): IconName {
  return 'repeat';  // Same icon, different styling for different modes
}

/**
 * Helper function to determine if repeat icon should show badge
 */
export function shouldShowRepeatBadge(mode: 'off' | 'one' | 'all'): boolean | string {
  if (mode === 'one') return '1';
  return false;
}
