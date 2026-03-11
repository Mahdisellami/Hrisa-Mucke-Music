/**
 * SpotifyLayout Component
 *
 * Main layout wrapper providing Spotify-style 3-panel design:
 * - Sidebar (left, collapsible on mobile)
 * - Main content area (center)
 * - Bottom player bar (bottom)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Platform,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Sidebar } from './Sidebar';
import { BottomPlayer } from './BottomPlayer';
import { Icon } from '@/components/ui/Icon';
import { Colors, Spacing } from '@/constants/DesignTokens';
import { useBreakpoint } from '@/hooks/useBreakpoint';

interface SpotifyLayoutProps {
  children: React.ReactNode;
}

export function SpotifyLayout({ children }: SpotifyLayoutProps) {
  const { isMobile, isTablet } = useBreakpoint();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(isMobile);

  // Animation values
  const sidebarAnim = useRef(new Animated.Value(isMobile ? -280 : 0)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;

  // Update collapsed state when breakpoint changes
  useEffect(() => {
    if (isMobile) {
      setIsSidebarCollapsed(true);
    } else {
      setIsSidebarCollapsed(false);
    }
  }, [isMobile]);

  // Animate sidebar when collapsed state changes
  useEffect(() => {
    if (isMobile) {
      Animated.parallel([
        Animated.spring(sidebarAnim, {
          toValue: isSidebarCollapsed ? -280 : 0,
          useNativeDriver: true,
          friction: 8,
          tension: 65,
        }),
        Animated.timing(overlayAnim, {
          toValue: isSidebarCollapsed ? 0 : 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarCollapsed, isMobile, sidebarAnim, overlayAnim]);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {isMobile ? (
        <Animated.View
          style={[
            styles.sidebarContainer,
            styles.mobileSidebar,
            {
              transform: [{ translateX: sidebarAnim }],
            },
          ]}
        >
          <Sidebar isCollapsed={false} onToggle={handleToggleSidebar} />
        </Animated.View>
      ) : (
        <View style={styles.sidebarContainer}>
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggleSidebar} />
        </View>
      )}

      {/* Main Content Area */}
      <View style={styles.main}>
        {/* Hamburger Menu Button (Mobile Only) */}
        {isMobile && isSidebarCollapsed && (
          <TouchableOpacity
            style={styles.hamburgerButton}
            onPress={handleToggleSidebar}
            activeOpacity={0.7}
          >
            <Icon name="menu" size="lg" color={Colors.text.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.content}>{children}</View>

        {/* Bottom Player Bar */}
        <BottomPlayer />
      </View>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && !isSidebarCollapsed && (
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayAnim,
            },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setIsSidebarCollapsed(true)}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background.primary,
    height: '100%',
  },
  sidebarContainer: {
    height: '100%',
    zIndex: 100,
    ...Platform.select({
      web: {
        position: 'relative',
      },
      default: {
        position: 'relative',
      },
    }),
  },
  mobileSidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    zIndex: 100,
  },
  main: {
    flex: 1,
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  hamburgerButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 16,
    left: 16,
    zIndex: 10,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.background.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 90,
  },
});
