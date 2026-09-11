import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface StatCardProps {
  label: string;
  value: number;
  icon: string;
  color?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = Colors.primary,
  style,
}) => {
  return (
    <View style={[styles.card, { borderColor: Colors.border }, style]}>
      <View style={styles.headerRow}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={[styles.valueText, { color }]}>{value}</Text>
      </View>
      <Text style={[Typography.caption, styles.labelText]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    minWidth: 95,
    flex: 1,
    marginHorizontal: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  icon: {
    fontSize: 16,
  },
  valueText: {
    fontSize: 20,
    fontWeight: '800',
  },
  labelText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
