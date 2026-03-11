/**
 * Share Sheet Component
 *
 * Modal for sharing tracks and playlists to activity feed
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Share as RNShare,
  Platform,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import { shareTrack, sharePlaylist } from '@/api/endpoints';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  type: 'track' | 'playlist';
  itemId: number;
  itemName: string;
  onShareSuccess?: () => void;
}

export function ShareSheet({
  visible,
  onClose,
  type,
  itemId,
  itemName,
  onShareSuccess,
}: ShareSheetProps) {
  const [loading, setLoading] = useState(false);

  const handleShareToFeed = async () => {
    setLoading(true);
    try {
      if (type === 'track') {
        await shareTrack(itemId);
      } else {
        await sharePlaylist(itemId);
      }
      onShareSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error sharing to feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareExternal = async () => {
    try {
      const shareUrl = type === 'track'
        ? `/track/${itemId}`
        : `/playlist/${itemId}`;

      await RNShare.share({
        message: `Check out this ${type}: ${itemName}`,
        url: shareUrl,
        title: `Share ${type}`,
      });
    } catch (error) {
      console.error('Error sharing externally:', error);
    }
  };

  const handleCopyLink = async () => {
    // In a real app, you'd use Clipboard API
    // For now, just show feedback
    alert('Link copied to clipboard!');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.title}>Share {type}</Text>
            <Text style={styles.subtitle}>{itemName}</Text>
          </View>

          {/* Share Options */}
          <View style={styles.options}>
            {/* Share to Activity Feed */}
            <TouchableOpacity
              style={styles.option}
              onPress={handleShareToFeed}
              disabled={loading}
            >
              <View style={[styles.optionIcon, { backgroundColor: Colors.accent.primary }]}>
                {loading ? (
                  <ActivityIndicator size="small" color={Colors.background.primary} />
                ) : (
                  <Icon name="musical-notes" size="md" color={Colors.background.primary} />
                )}
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Share to Activity Feed</Text>
                <Text style={styles.optionSubtitle}>
                  Your followers will see this in their feed
                </Text>
              </View>
              <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
            </TouchableOpacity>

            {/* Share via... (System share sheet) */}
            <TouchableOpacity style={styles.option} onPress={handleShareExternal}>
              <View style={[styles.optionIcon, { backgroundColor: Colors.accent.secondary }]}>
                <Icon name="share-social" size="md" color={Colors.background.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Share via...</Text>
                <Text style={styles.optionSubtitle}>
                  Share using other apps
                </Text>
              </View>
              <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
            </TouchableOpacity>

            {/* Copy Link */}
            <TouchableOpacity style={styles.option} onPress={handleCopyLink}>
              <View style={[styles.optionIcon, { backgroundColor: '#8E24AA' }]}>
                <Icon name="document" size="md" color={Colors.background.primary} />
              </View>
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>Copy Link</Text>
                <Text style={styles.optionSubtitle}>
                  Copy link to clipboard
                </Text>
              </View>
              <Icon name="chevron-forward" size="sm" color={Colors.text.tertiary} />
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.background.elevated,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.base,
  },
  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing.base,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.background.subtle,
    borderRadius: 2,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.h3,
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  options: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.text.secondary,
  },
  cancelButton: {
    marginHorizontal: Spacing.xl,
    marginTop: Spacing.base,
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.semibold as any,
    color: Colors.text.primary,
  },
});
