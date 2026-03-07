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
import { getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PickerSheet, type PickerItem } from '@/components/ui/picker-sheet';

export default function BudgetFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [currencyCode, setCurrencyCode] = useState('');
  const [currencyDisplay, setCurrencyDisplay] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const budgetQuery = useQuery({ queryKey: ['budget', id], queryFn: () => api.getBudget(id!), enabled: isEditing });
  const currenciesQuery = useQuery({ queryKey: ['currencies-all'], queryFn: async () => (await api.getCurrencies(1)).data });

  useEffect(() => {
    if (budgetQuery.data?.data) {
      const attr = budgetQuery.data.data.attributes;
      setName(attr.name || ''); setNotes(attr.notes || '');
    }
  }, [budgetQuery.data]);

  const currencyItems: PickerItem[] = useMemo(() => (currenciesQuery.data || []).map((c: any) => ({
    id: c.attributes.code, label: `${c.attributes.code} - ${c.attributes.name}`, sublabel: `Symbol: ${c.attributes.symbol}`, icon: 'currency-exchange',
  })), [currenciesQuery.data]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a budget name'); return; }
    setSaving(true);
    try {
      if (isEditing) {
        await api.updateBudget(id!, { name: name.trim(), notes: notes || undefined });
      } else {
        const result = await api.createBudget({ name: name.trim(), notes: notes || undefined });
        if (limitAmount && parseFloat(limitAmount) > 0) {
          const budgetId = result.data.id;
          await api.createBudgetLimit(budgetId, { start: getStartOfMonth(), end: getEndOfMonth(), amount: limitAmount, currency_code: currencyCode || undefined });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-limits'] });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save budget'); } finally { setSaving(false); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? 'Edit Budget' : 'New Budget'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="pie-chart" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Budget Name *" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
              </View>
            </View>
          </View>

          {/* Monthly Limit */}
          {!isEditing ? (
            <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowCurrencyPicker(true)} activeOpacity={0.6}>
                <View style={styles.fieldRow}>
                  <MaterialIcons name="currency-exchange" size={18} color={colors.muted} style={styles.fieldIcon} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Limit Currency</Text>
                    <Text style={[styles.fieldValue, { color: currencyDisplay ? colors.foreground : colors.muted }]}>{currencyDisplay || currencyCode || 'Select (optional)...'}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                </View>
              </TouchableOpacity>
              <View style={styles.formField}>
                <View style={styles.fieldRow}>
                  <MaterialIcons name="speed" size={18} color={colors.muted} style={styles.fieldIcon} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Monthly Limit</Text>
                    <TextInput style={[styles.fieldValueInput, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.muted} value={limitAmount} onChangeText={setLimitAmount} keyboardType="decimal-pad" returnKeyType="done" />
                  </View>
                </View>
              </View>
            </View>
          ) : null}

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
