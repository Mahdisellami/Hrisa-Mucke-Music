/**
 * Follow Button Component
 *
 * Reusable button for following/unfollowing users
 */

import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/DesignTokens';
import { Icon } from '@/components/ui/Icon';
import { followUser, unfollowUser, isFollowing } from '@/api/endpoints';

interface FollowButtonProps {
  userId: number;
  initialFollowState?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary';
}

export function FollowButton({
  userId,
  initialFollowState,
  onFollowChange,
  size = 'medium',
  variant = 'primary',
}: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowState ?? false);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(initialFollowState === undefined);

  useEffect(() => {
    if (initialFollowState === undefined) {
      checkFollowStatus();
    }
  }, [userId]);

  const checkFollowStatus = async () => {
    setCheckingStatus(true);
    try {
      const status = await isFollowing(userId);
      setFollowing(status);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (following) {
        await unfollowUser(userId);
        setFollowing(false);
        onFollowChange?.(false);
      } else {
        await followUser(userId);
        setFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <TouchableOpacity
        style={[
          styles.button,
          styles[`${size}Button`],
          variant === 'secondary' && styles.secondaryButton,
        ]}
        disabled
      >
        <ActivityIndicator size="small" color={Colors.text.secondary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[`${size}Button`],
        following ? styles.followingButton : styles.followButton,
        variant === 'secondary' && following && styles.secondaryFollowingButton,
      ]}
      onPress={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={following ? Colors.text.primary : Colors.background.primary}
        />
      ) : (
        <>
          <Icon
            name={following ? 'checkmark' : 'person-add'}
            size={size === 'small' ? 'xs' : 'sm'}
            color={following ? Colors.text.primary : Colors.background.primary}
          />
          <Text
            style={[
              styles.buttonText,
              styles[`${size}Text`],
              following && styles.followingText,
            ]}
          >
            {following ? 'Following' : 'Follow'}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.pill,
  },
  // Sizes
  smallButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minWidth: 90,
  },
  mediumButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minWidth: 120,
  },
  largeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    minWidth: 140,
  },
  // States
  followButton: {
    backgroundColor: Colors.accent.primary,
  },
  followingButton: {
    backgroundColor: Colors.background.card,
    borderWidth: 1,
    borderColor: Colors.background.subtle,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  secondaryFollowingButton: {
    backgroundColor: 'transparent',
    borderColor: Colors.background.subtle,
  },
  // Text
  buttonText: {
    fontWeight: Typography.fontWeight.bold as any,
    color: Colors.background.primary,
  },
  smallText: {
    fontSize: Typography.fontSize.caption,
  },
  mediumText: {
    fontSize: Typography.fontSize.bodySmall,
  },
  largeText: {
    fontSize: Typography.fontSize.body,
  },
  followingText: {
    color: Colors.text.primary,
  },
});
