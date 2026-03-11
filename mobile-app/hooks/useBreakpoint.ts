/**
 * useBreakpoint Hook
 *
 * Provides responsive breakpoint information based on window dimensions
 */

import { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Breakpoints } from '@/constants/Breakpoints';

export interface BreakpointInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  width: number;
  height: number;
}

export function useBreakpoint(): BreakpointInfo {
  const { width, height } = useWindowDimensions();

  return {
    isMobile: width < Breakpoints.tablet,
    isTablet: width >= Breakpoints.tablet && width < Breakpoints.desktop,
    isDesktop: width >= Breakpoints.desktop && width < Breakpoints.wide,
    isWide: width >= Breakpoints.wide,
    width,
    height,
  };
}
