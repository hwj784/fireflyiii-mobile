import React, { useState, useEffect, useMemo } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PickerSheet, type PickerItem } from '@/components/ui/picker-sheet';
import { DatePickerField } from '@/components/ui/date-picker';

const REPEAT_FREQS: PickerItem[] = [
  { id: 'weekly', label: 'Weekly', sublabel: 'Every week', icon: 'event-repeat' },
  { id: 'monthly', label: 'Monthly', sublabel: 'Every month', icon: 'event-repeat' },
  { id: 'quarterly', label: 'Quarterly', sublabel: 'Every 3 months', icon: 'event-repeat' },
  { id: 'half-year', label: 'Half-Yearly', sublabel: 'Every 6 months', icon: 'event-repeat' },
  { id: 'yearly', label: 'Yearly', sublabel: 'Every year', icon: 'event-repeat' },
];

export default function BillFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [date, setDate] = useState('');
  const [repeatFreq, setRepeatFreq] = useState('monthly');
  const [currencyCode, setCurrencyCode] = useState('');
  const [currencyDisplay, setCurrencyDisplay] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const [showFreqPicker, setShowFreqPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const billQuery = useQuery({ queryKey: ['bill', id], queryFn: () => api.getBill(id!), enabled: isEditing });
  const currenciesQuery = useQuery({ queryKey: ['currencies-all'], queryFn: async () => (await api.getCurrencies(1)).data });

  useEffect(() => {
    if (billQuery.data?.data) {
      const attr = billQuery.data.data.attributes;
      setName(attr.name || ''); setAmountMin(attr.amount_min || ''); setAmountMax(attr.amount_max || '');
      setDate(attr.date?.split('T')[0] || ''); setRepeatFreq(attr.repeat_freq || 'monthly');
      setCurrencyCode(attr.currency_code || '');
      if (attr.currency_code) setCurrencyDisplay(`${attr.currency_code} (${attr.currency_symbol || ''})`);
      setNotes(attr.notes || '');
    }
  }, [billQuery.data]);

  const currencyItems: PickerItem[] = useMemo(() => (currenciesQuery.data || []).map((c: any) => ({
    id: c.attributes.code, label: `${c.attributes.code} - ${c.attributes.name}`, sublabel: `Symbol: ${c.attributes.symbol}`, icon: 'currency-exchange',
  })), [currenciesQuery.data]);

  const handleSave = async () => {
    if (!name.trim() || !amountMin || !amountMax) { Alert.alert('Error', 'Please fill in name and amount range'); return; }
    setSaving(true);
    try {
      const data: any = { name: name.trim(), amount_min: amountMin, amount_max: amountMax, date: date || new Date().toISOString().split('T')[0], repeat_freq: repeatFreq, currency_code: currencyCode || undefined, notes: notes || undefined };
      if (isEditing) { await api.updateBill(id!, data); } else { await api.createBill(data); }
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const selectedFreqLabel = REPEAT_FREQS.find((f) => f.id === repeatFreq)?.label || repeatFreq;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? 'Edit Bill' : 'New Bill'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="receipt-long" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Bill Name *" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
              </View>
            </View>
          </View>

          {/* Amount Range */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowCurrencyPicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="currency-exchange" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Currency</Text>
                  <Text style={[styles.fieldValue, { color: currencyDisplay ? colors.foreground : colors.muted }]}>{currencyDisplay || currencyCode || 'Select...'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="arrow-downward" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Min Amount *</Text>
                  <TextInput style={[styles.fieldValueInput, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.muted} value={amountMin} onChangeText={setAmountMin} keyboardType="decimal-pad" returnKeyType="done" />
                </View>
              </View>
            </View>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="arrow-upward" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Max Amount *</Text>
                  <TextInput style={[styles.fieldValueInput, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.muted} value={amountMax} onChangeText={setAmountMax} keyboardType="decimal-pad" returnKeyType="done" />
                </View>
              </View>
            </View>
          </View>

          {/* Schedule */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <DatePickerField label="Start Date" value={date} onChange={setDate} />
            </View>
            <TouchableOpacity style={styles.formField} onPress={() => setShowFreqPicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="event-repeat" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Frequency</Text>
                  <Text style={[styles.fieldValue, { color: colors.foreground }]}>{selectedFreqLabel}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Notes */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="notes" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground, minHeight: 50 }]} placeholder="Notes (optional)" placeholderTextColor={colors.muted} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerSheet visible={showFreqPicker} onClose={() => setShowFreqPicker(false)} title="Frequency" items={REPEAT_FREQS} selectedId={repeatFreq} onSelect={(item) => setRepeatFreq(item.id)} searchable={false} />
      <PickerSheet visible={showCurrencyPicker} onClose={() => setShowCurrencyPicker(false)} title="Select Currency" items={currencyItems} selectedId={currencyCode} onSelect={(item) => { setCurrencyCode(item.id); setCurrencyDisplay(item.label); }} loading={currenciesQuery.isLoading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', marginLeft: 12, letterSpacing: -0.3 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  formSection: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  formField: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 12 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  fieldValueInput: { fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
});
