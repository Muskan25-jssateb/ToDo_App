import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Task } from '../types';
import { Colors } from '../theme/colors';
import { Typography } from '../theme/typography';
import { CustomButton } from './CustomButton';

interface FocusTimerModalProps {
  visible: boolean;
  task: Task;
  onClose: () => void;
  onCompleteTask: (taskId: string) => void;
}

type Mode = 'focus' | 'break';

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  visible,
  task,
  onClose,
  onCompleteTask,
}) => {
  const [mode, setMode] = useState<Mode>('focus');
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (visible) {
      // Reset timer on open
      switchMode('focus');
    } else {
      stopTimer();
    }
  }, [visible]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            stopTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      stopTimer();
    }
    return () => stopTimer();
  }, [isActive]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const switchMode = (newMode: Mode) => {
    stopTimer();
    setIsActive(false);
    setMode(newMode);
    const secs = newMode === 'focus' ? 25 * 60 : 5 * 60;
    setTotalSeconds(secs);
    setSecondsRemaining(secs);
  };

  const toggleStartPause = () => {
    if (secondsRemaining === 0) {
      setSecondsRemaining(totalSeconds);
    }
    setIsActive((prev) => !prev);
  };

  const resetTimer = () => {
    stopTimer();
    setIsActive(false);
    setSecondsRemaining(totalSeconds);
  };

  const addFiveMinutes = () => {
    setTotalSeconds((prev) => prev + 5 * 60);
    setSecondsRemaining((prev) => prev + 5 * 60);
  };

  const formatTimeDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = Math.round(
    ((totalSeconds - secondsRemaining) / totalSeconds) * 100
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.screenTitle}>Focus Mode</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Mode Selector Tabs */}
          <View style={styles.modeTabs}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'focus' && styles.activeModeTab,
              ]}
              onPress={() => switchMode('focus')}
            >
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'focus' && styles.activeModeTabText,
                ]}
              >
                🎯 25m Focus
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'break' && styles.activeModeTab,
              ]}
              onPress={() => switchMode('break')}
            >
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'break' && styles.activeModeTabText,
                ]}
              >
                ☕ 5m Rest
              </Text>
            </TouchableOpacity>
          </View>

          {/* Task Info Pill */}
          <View style={styles.taskCard}>
            <Text style={styles.taskPrefix}>FOCUSING ON</Text>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {task.title}
            </Text>
          </View>

          {/* Large Countdown Display */}
          <View style={styles.timerCircleWrapper}>
            <View style={styles.timerCircle}>
              <Text style={styles.timerText}>
                {formatTimeDisplay(secondsRemaining)}
              </Text>
              <Text style={styles.timerStatus}>
                {secondsRemaining === 0
                  ? '🎉 Session Completed!'
                  : isActive
                  ? '⚡ Deep Work in Progress'
                  : '⏸️ Paused'}
              </Text>
            </View>

            {/* Linear Progress Bar below */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor:
                      mode === 'focus' ? Colors.accentLight : Colors.completed,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progressPercentage}% completed</Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={styles.secondaryControl}
              onPress={resetTimer}
              activeOpacity={0.7}
            >
              <Text style={styles.controlIcon}>↺</Text>
              <Text style={styles.controlLabel}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mainPlayButton,
                isActive ? styles.pauseButton : styles.playButton,
              ]}
              onPress={toggleStartPause}
              activeOpacity={0.8}
            >
              <Text style={styles.playIcon}>{isActive ? '⏸' : '▶'}</Text>
              <Text style={styles.playText}>
                {isActive ? 'Pause' : secondsRemaining === 0 ? 'Restart' : 'Start'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryControl}
              onPress={addFiveMinutes}
              activeOpacity={0.7}
            >
              <Text style={styles.controlIcon}>+5m</Text>
              <Text style={styles.controlLabel}>Add Time</Text>
            </TouchableOpacity>
          </View>

          {/* Finish & Complete Task Action */}
          <View style={styles.footerAction}>
            <CustomButton
              title="✓ Mark Task as Completed"
              variant="secondary"
              onPress={() => {
                onCompleteTask(task._id);
                onClose();
              }}
              style={styles.completeButton}
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
  },
  closeIcon: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  screenTitle: {
    ...Typography.h3,
    color: Colors.textPrimary,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 4,
    marginVertical: 10,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeModeTab: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  modeTabText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  activeModeTabText: {
    color: Colors.white,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  taskPrefix: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.accentLight,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  taskTitle: {
    ...Typography.bodyLarge,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  timerCircleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: Colors.surface,
    borderWidth: 3,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  timerText: {
    fontSize: 52,
    fontWeight: '900',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  timerStatus: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    fontWeight: '600',
  },
  progressBarTrack: {
    width: '80%',
    height: 6,
    backgroundColor: Colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 10,
  },
  secondaryControl: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  controlIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  controlLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  mainPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    height: 65,
    borderRadius: 22,
    gap: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButton: {
    backgroundColor: Colors.primary,
  },
  pauseButton: {
    backgroundColor: '#F59E0B',
  },
  playIcon: {
    fontSize: 20,
    color: '#090A0E',
  },
  playText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#090A0E',
  },
  footerAction: {
    paddingTop: 10,
  },
  completeButton: {
    borderColor: Colors.completedMuted,
  },
});
