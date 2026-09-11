import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';

interface DateTimePickerModalProps {
  visible: boolean;
  initialDate?: Date | null;
  title?: string;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  visible,
  initialDate,
  title = 'Set Date & Time',
  onConfirm,
  onClose,
}) => {
  const base = initialDate ? new Date(initialDate) : new Date();

  const [activeTab, setActiveTab] = useState<'calendar' | 'time'>('calendar');

  // Date State
  const [viewYear, setViewYear] = useState(base.getFullYear());
  const [viewMonth, setViewMonth] = useState(base.getMonth());
  const [selectedDay, setSelectedDay] = useState(base.getDate());

  // Time State
  const rawHours = base.getHours();
  const initPeriod = rawHours >= 12 ? 'PM' : 'AM';
  const initHour12 = rawHours % 12 === 0 ? 12 : rawHours % 12;
  const initMinute = Math.round(base.getMinutes() / 5) * 5 % 60;

  const [selectedHour, setSelectedHour] = useState(initHour12);
  const [selectedMinute, setSelectedMinute] = useState(initMinute);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>(initPeriod);

  // Month navigation
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick Preset Handlers
  const handleQuickPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    setSelectedDay(target.getDate());
  };

  // Days in month calculation
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  // Monday as index 0:
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === viewYear && today.getMonth() === viewMonth;

  // Confirm
  const handleSave = () => {
    let hour24 = selectedHour % 12;
    if (selectedPeriod === 'PM') hour24 += 12;

    const result = new Date(
      viewYear,
      viewMonth,
      selectedDay,
      hour24,
      selectedMinute,
      0
    );
    onConfirm(result);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Mode Switcher Tabs */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
              onPress={() => setActiveTab('calendar')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'calendar' && styles.activeTabText,
                ]}
              >
                📅 Date ({selectedDay} {MONTH_NAMES[viewMonth].slice(0, 3)})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'time' && styles.activeTab]}
              onPress={() => setActiveTab('time')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'time' && styles.activeTabText,
                ]}
              >
                🕒 Time ({selectedHour}:{selectedMinute < 10 ? '0' : ''}{selectedMinute} {selectedPeriod})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {activeTab === 'calendar' ? (
              <View>
                {/* Month Navigator */}
                <View style={styles.monthNav}>
                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handlePrevMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monthNavArrow}>◀</Text>
                  </TouchableOpacity>
                  <Text style={styles.monthTitle}>
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </Text>
                  <TouchableOpacity
                    style={styles.monthNavBtn}
                    onPress={handleNextMonth}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.monthNavArrow}>▶</Text>
                  </TouchableOpacity>
                </View>

                {/* Weekday Labels */}
                <View style={styles.weekdaysRow}>
                  {WEEKDAYS.map((day) => (
                    <Text key={day} style={styles.weekdayText}>
                      {day}
                    </Text>
                  ))}
                </View>

                {/* Calendar Days Grid */}
                <View style={styles.daysGrid}>
                  {/* Empty slots for offset */}
                  {Array.from({ length: startOffset }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected = dayNum === selectedDay;
                    const isToday = isCurrentMonthToday && dayNum === today.getDate();

                    return (
                      <TouchableOpacity
                        key={`day-${dayNum}`}
                        style={[
                          styles.dayCell,
                          isSelected && styles.selectedDayCell,
                          isToday && !isSelected && styles.todayCell,
                        ]}
                        onPress={() => setSelectedDay(dayNum)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.selectedDayText,
                            isToday && !isSelected && styles.todayText,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Quick Date Presets */}
                <View style={styles.quickPresetsRow}>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => handleQuickPreset(0)}
                  >
                    <Text style={styles.presetText}>Today</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => handleQuickPreset(1)}
                  >
                    <Text style={styles.presetText}>Tomorrow</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => handleQuickPreset(3)}
                  >
                    <Text style={styles.presetText}>In 3 Days</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => handleQuickPreset(7)}
                  >
                    <Text style={styles.presetText}>Next Week</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.timePickerContainer}>
                {/* Time Display */}
                <View style={styles.timeBigDisplay}>
                  <Text style={styles.timeBigText}>
                    {selectedHour < 10 ? '0' : ''}{selectedHour} : {selectedMinute < 10 ? '0' : ''}{selectedMinute}
                  </Text>
                  <Text style={styles.periodBadge}>{selectedPeriod}</Text>
                </View>

                {/* Stepper Controls */}
                <View style={styles.stepperRow}>
                  {/* Hours Stepper */}
                  <View style={styles.stepperGroup}>
                    <Text style={styles.stepperLabel}>HOUR</Text>
                    <View style={styles.stepperBox}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          setSelectedHour((h) => (h === 12 ? 1 : h + 1))
                        }
                      >
                        <Text style={styles.stepBtnText}>▲</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>
                        {selectedHour < 10 ? '0' : ''}{selectedHour}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          setSelectedHour((h) => (h === 1 ? 12 : h - 1))
                        }
                      >
                        <Text style={styles.stepBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Minute Stepper */}
                  <View style={styles.stepperGroup}>
                    <Text style={styles.stepperLabel}>MINUTE</Text>
                    <View style={styles.stepperBox}>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          setSelectedMinute((m) => (m >= 55 ? 0 : m + 5))
                        }
                      >
                        <Text style={styles.stepBtnText}>▲</Text>
                      </TouchableOpacity>
                      <Text style={styles.stepperValue}>
                        {selectedMinute < 10 ? '0' : ''}{selectedMinute}
                      </Text>
                      <TouchableOpacity
                        style={styles.stepBtn}
                        onPress={() =>
                          setSelectedMinute((m) => (m <= 0 ? 55 : m - 5))
                        }
                      >
                        <Text style={styles.stepBtnText}>▼</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Period Switcher */}
                  <View style={styles.stepperGroup}>
                    <Text style={styles.stepperLabel}>AM / PM</Text>
                    <View style={styles.periodSwitchBox}>
                      <TouchableOpacity
                        style={[
                          styles.periodOption,
                          selectedPeriod === 'AM' && styles.activePeriodOption,
                        ]}
                        onPress={() => setSelectedPeriod('AM')}
                      >
                        <Text
                          style={[
                            styles.periodOptionText,
                            selectedPeriod === 'AM' && styles.activePeriodText,
                          ]}
                        >
                          AM
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.periodOption,
                          selectedPeriod === 'PM' && styles.activePeriodOption,
                        ]}
                        onPress={() => setSelectedPeriod('PM')}
                      >
                        <Text
                          style={[
                            styles.periodOptionText,
                            selectedPeriod === 'PM' && styles.activePeriodText,
                          ]}
                        >
                          PM
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Quick Time Presets */}
                <Text style={styles.quickTimeLabel}>Quick Presets:</Text>
                <View style={styles.quickPresetsRow}>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => {
                      setSelectedHour(9);
                      setSelectedMinute(0);
                      setSelectedPeriod('AM');
                    }}
                  >
                    <Text style={styles.presetText}>9:00 AM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => {
                      setSelectedHour(12);
                      setSelectedMinute(0);
                      setSelectedPeriod('PM');
                    }}
                  >
                    <Text style={styles.presetText}>12:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => {
                      setSelectedHour(5);
                      setSelectedMinute(0);
                      setSelectedPeriod('PM');
                    }}
                  >
                    <Text style={styles.presetText}>5:00 PM</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetChip}
                    onPress={() => {
                      setSelectedHour(9);
                      setSelectedMinute(0);
                      setSelectedPeriod('PM');
                    }}
                  >
                    <Text style={styles.presetText}>9:00 PM</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>Confirm & Set</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    ...Typography.h2,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  closeBtn: {
    color: Colors.textMuted,
    fontSize: 18,
    padding: 4,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    ...Typography.caption,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  contentScroll: {
    marginBottom: 16,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthNavBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  monthNavArrow: {
    color: Colors.primaryLight,
    fontSize: 14,
  },
  monthTitle: {
    ...Typography.h2,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weekdayText: {
    width: 40,
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
    borderRadius: 20,
  },
  selectedDayCell: {
    backgroundColor: Colors.primary,
  },
  todayCell: {
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  dayText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedDayText: {
    color: Colors.white,
    fontWeight: '800',
  },
  todayText: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  quickPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  presetChip: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  timePickerContainer: {
    paddingVertical: 8,
  },
  timeBigDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 16,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 12,
  },
  timeBigText: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 2,
  },
  periodBadge: {
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontWeight: '800',
    fontSize: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperGroup: {
    alignItems: 'center',
  },
  stepperLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 1,
  },
  stepperBox: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    width: 68,
  },
  stepBtn: {
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  stepBtnText: {
    color: Colors.primaryLight,
    fontSize: 12,
  },
  stepperValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    paddingVertical: 4,
  },
  periodSwitchBox: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 96,
    justifyContent: 'space-around',
    width: 68,
  },
  periodOption: {
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activePeriodOption: {
    backgroundColor: Colors.primary,
  },
  periodOptionText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  activePeriodText: {
    color: Colors.white,
  },
  quickTimeLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  confirmText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
