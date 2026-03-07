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

export default function PiggyFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const piggyQuery = useQuery({ queryKey: ['piggy-bank', id], queryFn: () => api.getPiggyBank(id!), enabled: isEditing });
  const accountsQuery = useQuery({ queryKey: ['accounts-asset'], queryFn: async () => (await api.getAccounts(1, 'asset')).data });

  useEffect(() => {
    if (piggyQuery.data?.data) {
      const attr = piggyQuery.data.data.attributes;
      setName(attr.name || ''); setAccountId(String(attr.account_id || ''));
      setAccountName(attr.account_name || ''); setTargetAmount(attr.target_amount || '');
      setNotes(attr.notes || ''); setTargetDate(attr.target_date?.split('T')[0] || '');
    }
  }, [piggyQuery.data]);

  const accountItems: PickerItem[] = useMemo(() => (accountsQuery.data || []).map((a: any) => ({
    id: String(a.id), label: a.attributes.name,
    sublabel: `${a.attributes.currency_symbol || ''}${parseFloat(a.attributes.current_balance || 0).toFixed(2)}`,
    icon: a.attributes.account_role === 'savingAsset' ? 'savings' : a.attributes.account_role === 'ccAsset' ? 'credit-card' : 'account-balance',
  })), [accountsQuery.data]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    if (!accountId && !isEditing) { Alert.alert('Error', 'Please select an account'); return; }
    setSaving(true);
    try {
      const data: any = { name: name.trim(), account_id: accountId || undefined, target_amount: targetAmount || null, notes: notes || undefined, target_date: targetDate || undefined };
      if (isEditing) { await api.updatePiggyBank(id!, data); } else { await api.createPiggyBank(data); }
      queryClient.invalidateQueries({ queryKey: ['piggy-banks'] });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? 'Edit Piggy Bank' : 'New Piggy Bank'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="savings" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Piggy Bank Name *" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
              </View>
            </View>
          </View>

          {/* Account & Target */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowAccountPicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="account-balance" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Linked Account{!isEditing ? ' *' : ''}</Text>
                  <Text style={[styles.fieldValue, { color: accountName ? colors.foreground : colors.muted }]}>{accountName || 'Select asset account...'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="flag" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Target Amount</Text>
                  <TextInput style={[styles.fieldValueInput, { color: colors.foreground }]} placeholder="0.00" placeholderTextColor={colors.muted} value={targetAmount} onChangeText={setTargetAmount} keyboardType="decimal-pad" returnKeyType="done" />
                </View>
              </View>
            </View>
            <View style={styles.formField}>
              <DatePickerField label="Target Date" value={targetDate} onChange={setTargetDate} />
            </View>
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

      <PickerSheet visible={showAccountPicker} onClose={() => setShowAccountPicker(false)} title="Select Asset Account" items={accountItems} selectedId={accountId} onSelect={(item) => { setAccountId(item.id); setAccountName(item.label); }} loading={accountsQuery.isLoading} />
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
