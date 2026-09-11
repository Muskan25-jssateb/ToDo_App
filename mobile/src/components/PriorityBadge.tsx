import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { PriorityLevel } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  style?: ViewStyle;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, style }) => {
  const getBadgeConfig = () => {
    switch (priority) {
      case 'URGENT':
        return {
          label: 'URGENT',
          icon: '⚡',
          color: '#FFE4E6',
          border: '#F43F5E',
          bg: 'rgba(225, 29, 72, 0.24)',
        };
      case 'HIGH':
        return {
          label: 'HIGH',
          icon: '🔥',
          color: '#FFEDD5',
          border: '#FB923C',
          bg: 'rgba(234, 88, 12, 0.24)',
        };
      case 'MEDIUM':
        return {
          label: 'MEDIUM',
          icon: '⚡',
          color: '#FEF3C7',
          border: '#FBBF24',
          bg: 'rgba(217, 119, 6, 0.24)',
        };
      case 'LOW':
        return {
          label: 'LOW',
          icon: '🌱',
          color: '#D1FAE5',
          border: '#34D399',
          bg: 'rgba(16, 185, 129, 0.24)',
        };
      default:
        return {
          label: 'MEDIUM',
          icon: '•',
          color: Colors.textSecondary,
          border: Colors.border,
          bg: Colors.surfaceLight,
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <View
      style={[
        styles.badgeContainer,
        { backgroundColor: config.bg, borderColor: config.border },
        style,
      ]}
    >
      <Text style={styles.iconText}>{config.icon}</Text>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1.5,
    gap: 4,
  },
  iconText: {
    fontSize: 10,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
