/**
 * Responsive Breakpoints
 *
 * Defines screen size breakpoints for responsive layout
 */

export const Breakpoints = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

export type BreakpointName = keyof typeof Breakpoints;
