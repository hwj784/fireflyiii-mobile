import React, { useState, useMemo } from 'react';
import {
  Text, View, TouchableOpacity, Modal,
} from 'react-native';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface DatePickerProps {
  value: string; // YYYY-MM-DD
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
      return `${MONTHS[m - 1]} ${d}, ${y}`;
    } catch {
      return value;
    }
  }, [value]);

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-foreground mb-1">
        {label}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        className="bg-surface border border-border rounded-xl px-4 py-3 flex-row items-center"
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="event" size={18} color={colors.muted} style={{ marginRight: 8 }} />
        <Text className={`flex-1 text-base ${displayValue ? 'text-foreground' : 'text-muted'}`}>
          {displayValue || placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={22} color={colors.muted} />
      </TouchableOpacity>
      <CalendarModal
        visible={visible}
        onClose={() => setVisible(false)}
        value={value}
        onChange={(d) => { onChange(d); setVisible(false); }}
      />
    </View>
  );
}

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (date: string) => void;
}

function CalendarModal({ visible, onClose, value, onChange }: CalendarModalProps) {
  const colors = useColors();
  const today = new Date();
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0]);
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return parseInt(value.split('-')[1]) - 1;
    return today.getMonth();
  });

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const days = useMemo(() => {
    const arr: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(i);
    return arr;
  }, [viewYear, viewMonth, firstDayOfWeek, daysInMonth]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' }}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40 }}>
        {/* Handle */}
        <View className="items-center pt-2 pb-1">
          <View className="w-10 h-1 rounded-full bg-border" />
        </View>

        {/* Month/Year nav */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <TouchableOpacity onPress={goToPrevMonth} className="p-1">
            <MaterialIcons name="chevron-left" size={28} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">
            {MONTHS[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} className="p-1">
            <MaterialIcons name="chevron-right" size={28} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Weekday headers */}
        <View className="flex-row px-2">
          {WEEKDAYS.map((wd) => (
            <View key={wd} className="flex-1 items-center py-1">
              <Text className="text-xs font-medium text-muted">{wd}</Text>
            </View>
          ))}
        </View>

        {/* Days grid */}
        <View className="flex-row flex-wrap px-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 44 }} />;
            }
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = dateStr === value;
            const isToday = dateStr === todayStr;

            return (
              <TouchableOpacity
                key={`day-${day}`}
                style={{ width: '14.28%', height: 44, alignItems: 'center', justifyContent: 'center' }}
                onPress={() => selectDay(day)}
                activeOpacity={0.6}
              >
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={[
                    isSelected && { backgroundColor: colors.primary },
                    isToday && !isSelected && { borderWidth: 1, borderColor: colors.primary },
                  ]}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: isSelected ? '#fff' : isToday ? colors.primary : colors.foreground,
                      fontWeight: isSelected || isToday ? '600' : '400',
                    }}
                  >
                    {day}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick actions */}
        <View className="flex-row justify-center gap-3 px-4 pt-3">
          <TouchableOpacity
            className="px-4 py-2 rounded-xl bg-surface border border-border"
            onPress={() => { onChange(todayStr); }}
          >
            <Text className="text-sm font-medium text-primary">Today</Text>
          </TouchableOpacity>
          {value ? (
            <TouchableOpacity
              className="px-4 py-2 rounded-xl bg-surface border border-border"
              onPress={() => { onChange(''); }}
            >
              <Text className="text-sm font-medium text-error">Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}
