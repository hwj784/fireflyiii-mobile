import React, { useState, useMemo } from 'react';
import { Text, View, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export function DatePickerField({ value, onChange, label, placeholder = 'Select date', required }: DatePickerProps) {
  const colors = useColors();
  const [visible, setVisible] = useState(false);

  const displayValue = useMemo(() => {
    if (!value) return '';
    try {
      const [y, m, d] = value.split('-').map(Number);
      return `${MONTHS[m - 1]?.slice(0, 3)} ${d}, ${y}`;
    } catch { return value; }
  }, [value]);

  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.muted, marginBottom: 4 }}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity style={[styles.fieldBox, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <MaterialIcons name="event" size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: displayValue ? colors.foreground : colors.muted }}>{displayValue || placeholder}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.muted} />
      </TouchableOpacity>
      <CalendarModal visible={visible} onClose={() => setVisible(false)} value={value} onChange={(d) => { onChange(d); setVisible(false); }} />
    </View>
  );
}

function CalendarModal({ visible, onClose, value, onChange }: { visible: boolean; onClose: () => void; value: string; onChange: (date: string) => void }) {
  const colors = useColors();
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => value ? parseInt(value.split('-')[0]) : today.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => value ? parseInt(value.split('-')[1]) - 1 : today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [viewYear, viewMonth, firstDayOfWeek, daysInMonth]);

  const goToPrevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); } else setViewMonth(viewMonth - 1); };
  const goToNextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); } else setViewMonth(viewMonth + 1); };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={styles.handleRow}><View style={[styles.handle, { backgroundColor: colors.border }]} /></View>

        {/* Month/Year nav */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={goToPrevMonth} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="chevron-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>{MONTHS[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={goToNextMonth} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="chevron-right" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((wd) => (
            <View key={wd} style={styles.weekCell}>
              <Text style={[styles.weekText, { color: colors.muted }]}>{wd}</Text>
            </View>
          ))}
        </View>

        {/* Days grid */}
        <View style={styles.daysGrid}>
          {days.map((day, idx) => {
            if (day === null) return <View key={`empty-${idx}`} style={styles.dayCell} />;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === value;
            const isToday = dateStr === todayStr;
            return (
              <TouchableOpacity key={`day-${day}`} style={styles.dayCell} onPress={() => selectDay(day)} activeOpacity={0.6}>
                <View style={[styles.dayCircle, isSelected && { backgroundColor: colors.primary }, isToday && !isSelected && { borderWidth: 1.5, borderColor: colors.primary }]}>
                  <Text style={{ fontSize: 14, color: isSelected ? '#fff' : isToday ? colors.primary : colors.foreground, fontWeight: isSelected || isToday ? '700' : '400' }}>{day}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '14' }]} onPress={() => onChange(todayStr)}>
            <Text style={[styles.actionText, { color: colors.primary }]}>Today</Text>
          </TouchableOpacity>
          {value ? (
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error + '14' }]} onPress={() => onChange('')}>
              <Text style={[styles.actionText, { color: colors.error }]}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 20 },
  handleRow: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  navBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  weekRow: { flexDirection: 'row', paddingHorizontal: 8 },
  weekCell: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  weekText: { fontSize: 12, fontWeight: '600' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8 },
  dayCell: { width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' },
  dayCircle: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 12 },
  actionBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  actionText: { fontSize: 13, fontWeight: '700' },
  fieldBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
});
