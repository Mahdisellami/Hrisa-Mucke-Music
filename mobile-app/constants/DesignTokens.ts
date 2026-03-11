/**
 * Design Tokens
 *
 * Centralized design system values matching the Settings screen aesthetic.
 * All screens should use these tokens for consistency.
 */

// Color System
export const Colors = {
  background: {
    primary: '#121212',      // Main background (darkest)
    elevated: '#282828',     // Cards, modals, elevated surfaces
    surface: '#1e1e1e',      // Secondary surfaces, nested elements
    card: '#2a2a2a',         // Content cards
    subtle: '#3e3e3e',       // Borders, dividers
    modal: 'rgba(0, 0, 0, 0.8)', // Modal overlay
  },

  accent: {
    primary: '#1DB954',      // Spotify green (active states, primary actions)
    secondary: '#9B59B6',    // Purple (custom playlists)
    youtube: '#FF0000',      // YouTube red
    danger: '#ff4444',       // Destructive actions
  },

  text: {
    primary: '#ffffff',      // Primary text, high contrast
    secondary: '#b3b3b3',    // Secondary text, medium contrast
    tertiary: '#999999',     // Tertiary text, labels
    quaternary: '#666666',   // Disabled, very low contrast
    inactive: '#999999',     // Inactive states
  },

  interactive: {
    primary: '#1DB954',      // Primary buttons, active states
    secondary: '#3e3e3e',    // Secondary buttons
    danger: '#ff4444',       // Delete, destructive actions
    border: '#3e3e3e',       // Button borders
    disabled: '#2a2a2a',     // Disabled button background
  },
};

// Typography Scale
export const Typography = {
  fontSize: {
    h1: 32,           // Page headers (Settings, Now Playing)
    h2: 28,           // Section headers, large titles
    h3: 22,           // Card titles
    h4: 20,           // Modal titles, subsection headers
    body: 16,         // Body text, buttons
    bodySmall: 14,    // Secondary text, descriptions
    label: 13,        // Labels (uppercase), small buttons
    caption: 12,      // Captions, timestamps, metadata
  },

  fontWeight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.8,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 1,
  },
};

// Spacing System (8px base unit)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 30,
  xxxl: 32,
};

// Border Radius
export const BorderRadius = {
  xs: 6,            // Album art, small elements
  sm: 8,            // Input fields, small cards
  md: 12,           // Standard cards
  lg: 16,           // Modals, large cards
  pill: 20,         // Pill-shaped buttons (Settings speed/EQ)
  round: 50,        // Circular buttons
};

// Shadow System
export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
};

// Icon Sizes
export const IconSizes = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

// Button Sizes
export const ButtonSizes = {
  small: {
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: Typography.fontSize.bodySmall,
  },

  medium: {
    height: 44,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: Typography.fontSize.body,
  },

  large: {
    height: 52,
    paddingHorizontal: 24,
    paddingVertical: 16,
    fontSize: Typography.fontSize.body,
  },
};

// Touch Target Sizes (minimum 44x44 for accessibility)
export const TouchTargets = {
  minimum: 44,      // Minimum touch target size (iOS HIG)
  small: 36,        // Small buttons (with adequate spacing)
  medium: 44,       // Standard buttons
  large: 56,        // Large buttons
};

// Animation Durations
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 350,
};

// Z-Index Layers
export const ZIndex = {
  base: 0,
  elevated: 10,
  dropdown: 100,
  modal: 1000,
  toast: 2000,
};

// Default export consolidating all design tokens
export const DesignTokens = {
  colors: {
    background: Colors.background.primary,
    surface: Colors.background.surface,
    elevated: Colors.background.elevated,
    card: Colors.background.card,
    subtle: Colors.background.subtle,
    modal: Colors.background.modal,
    accent: Colors.accent.primary,
    accentSecondary: Colors.accent.secondary,
    youtube: Colors.accent.youtube,
    error: Colors.accent.danger,
    danger: Colors.accent.danger,
    textPrimary: Colors.text.primary,
    textSecondary: Colors.text.secondary,
    textTertiary: Colors.text.tertiary,
    textQuaternary: Colors.text.quaternary,
    textInactive: Colors.text.inactive,
    interactive: Colors.interactive.primary,
    interactiveSecondary: Colors.interactive.secondary,
    interactiveDanger: Colors.interactive.danger,
    border: Colors.interactive.border,
    disabled: Colors.interactive.disabled,
  },
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  iconSizes: IconSizes,
  buttonSizes: ButtonSizes,
  touchTargets: TouchTargets,
  animations: Animations,
  zIndex: ZIndex,
};
