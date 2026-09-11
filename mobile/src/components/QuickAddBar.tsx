import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { parseNaturalLanguageTask, ParsedTaskInput } from '../utils/nlpParser';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { formatDateTime } from '../utils/dateUtils';
import { PriorityLevel } from '../types';

interface QuickAddBarProps {
  onAddTask: (task: {
    title: string;
    priority: PriorityLevel;
    category: string;
    deadline?: string;
    tags: string[];
  }) => Promise<void>;
  isLoading?: boolean;
}

export const QuickAddBar: React.FC<QuickAddBarProps> = ({
  onAddTask,
  isLoading = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const parsed: ParsedTaskInput = useMemo(() => {
    return parseNaturalLanguageTask(inputText);
  }, [inputText]);

  const hasMetadata =
    !!parsed.deadline || !!parsed.category || !!parsed.priority;

  const handleSubmit = async () => {
    if (!parsed.title.trim()) return;

    await onAddTask({
      title: parsed.title,
      priority: parsed.priority || 'MEDIUM',
      category: parsed.category || 'General',
      deadline: parsed.deadline ? parsed.deadline.toISOString() : undefined,
      tags: parsed.tags || [],
    });

    setInputText('');
    setIsExpanded(false);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.inputRow, isExpanded && styles.expandedInputRow]}>
        <Text style={styles.sparkleIcon}>⚡</Text>
        <TextInput
          placeholder="Quick add: 'Submit report tomorrow 5pm #work !urgent'"
          placeholderTextColor={Colors.textDisabled}
          value={inputText}
          onChangeText={(text) => {
            setInputText(text);
            if (!isExpanded && text.length > 0) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          onSubmitEditing={handleSubmit}
          returnKeyType="done"
          style={styles.textInput}
        />
        {inputText.length > 0 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleSubmit}
            disabled={isLoading || !parsed.title.trim()}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#090A0E" />
            ) : (
              <Text style={styles.addIcon}>＋</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Live NLP Parse Preview Pills */}
      {isExpanded && inputText.length > 0 && (
        <View style={styles.previewContainer}>
          <View style={styles.previewHeaderRow}>
            <Text style={styles.previewTitleLabel}>Smart Preview:</Text>
            {inputText.length > 0 && (
              <TouchableOpacity onPress={() => setInputText('')}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.pillsRow}>
            {/* Title */}
            <View style={styles.pillBadge}>
              <Text style={styles.pillText} numberOfLines={1}>
                📝 {parsed.title || '(type task title...)'}
              </Text>
            </View>

            {/* Deadline */}
            {parsed.deadline && (
              <View style={[styles.pillBadge, styles.deadlinePill]}>
                <Text style={[styles.pillText, styles.deadlineText]}>
                  ⏰ {formatDateTime(parsed.deadline.toISOString())}
                </Text>
              </View>
            )}

            {/* Category */}
            {parsed.category && (
              <View style={[styles.pillBadge, styles.categoryPill]}>
                <Text style={[styles.pillText, styles.categoryText]}>
                  🏷️ {parsed.category}
                </Text>
              </View>
            )}

            {/* Priority */}
            {parsed.priority && (
              <View style={[styles.pillBadge, styles.priorityPill]}>
                <Text style={[styles.pillText, styles.priorityText]}>
                  🚨 {parsed.priority}
                </Text>
              </View>
            )}
          </View>

          {!hasMetadata && (
            <Text style={styles.hintText}>
              Tip: Use !urgent, !high, #work, #study, tomorrow, or in 3 hours
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    minHeight: 48,
  },
  expandedInputRow: {
    borderColor: Colors.accentLight,
    backgroundColor: Colors.surfaceCard,
  },
  sparkleIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13.5,
    paddingVertical: 8,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  addIcon: {
    fontSize: 18,
    fontWeight: '900',
    color: '#090A0E',
  },
  previewContainer: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    padding: 10,
    marginTop: -2,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: Colors.accentLight,
  },
  previewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewTitleLabel: {
    ...Typography.caption,
    color: Colors.accentLight,
    fontWeight: '700',
    fontSize: 10.5,
  },
  clearText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  pillBadge: {
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deadlinePill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  deadlineText: {
    color: '#FBBF24',
  },
  categoryPill: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  categoryText: {
    color: '#93C5FD',
  },
  priorityPill: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
    borderColor: '#E11D48',
  },
  priorityText: {
    color: '#FDA4AF',
  },
  hintText: {
    fontSize: 10.5,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 6,
  },
});
