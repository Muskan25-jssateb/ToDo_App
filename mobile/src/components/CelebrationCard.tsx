import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface CelebrationCardProps {
  completedCount: number;
  streakCount: number;
}

export const CelebrationCard: React.FC<CelebrationCardProps> = ({
  completedCount,
  streakCount,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badgeContainer}>
          <Text style={styles.badgeEmoji}>🏆</Text>
          <Text style={styles.badgeText}>INBOX ZERO</Text>
        </View>
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakText}>{streakCount} Day Streak</Text>
        </View>
      </View>

      <Text style={styles.title}>All Tasks Cleared! 🎉</Text>
      <Text style={styles.subtitle}>
        You've completed all {completedCount} task{completedCount > 1 ? 's' : ''}. Enjoy
        your productive momentum!
      </Text>

      <View style={styles.quoteBox}>
        <Text style={styles.quoteText}>
          "Focus on being productive instead of busy." — Tim Ferriss
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: Colors.completed,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  badgeEmoji: {
    fontSize: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6EE7B7',
    letterSpacing: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(234, 88, 12, 0.2)',
    borderColor: '#F97316',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  streakEmoji: {
    fontSize: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FDBA74',
  },
  title: {
    ...Typography.h3,
    color: Colors.textPrimary,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  quoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  quoteText: {
    fontStyle: 'italic',
    color: Colors.textMuted,
    fontSize: 11.5,
    textAlign: 'center',
  },
});
