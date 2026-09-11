import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface FilterPillProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: string;
  style?: ViewStyle;
}

export const FilterPill: React.FC<FilterPillProps> = ({
  label,
  isActive,
  onPress,
  icon,
  style,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.pill,
        isActive ? styles.activePill : styles.inactivePill,
        style,
      ]}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text
        style={[
          Typography.caption,
          styles.text,
          isActive ? styles.activeText : styles.inactiveText,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    gap: 5,
  },
  activePill: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  inactivePill: {
    backgroundColor: Colors.surfaceLight,
    borderColor: Colors.border,
  },
  icon: {
    fontSize: 12,
  },
  text: {
    fontSize: 12,
  },
  activeText: {
    color: Colors.white,
    fontWeight: '700',
  },
  inactiveText: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});
