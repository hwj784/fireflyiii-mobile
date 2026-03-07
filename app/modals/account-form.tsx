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

const ACCOUNT_TYPES: { id: string; label: string; icon: string; color: string }[] = [
  { id: 'asset', label: 'Asset', icon: 'account-balance', color: '#4F46E5' },
  { id: 'expense', label: 'Expense', icon: 'shopping-cart', color: '#DC2626' },
  { id: 'revenue', label: 'Revenue', icon: 'trending-up', color: '#059669' },
  { id: 'liability', label: 'Liability', icon: 'money-off', color: '#D97706' },
];

const ASSET_ROLES: { id: string; label: string; sublabel: string }[] = [
  { id: 'defaultAsset', label: 'Default Asset', sublabel: 'Regular checking/savings account' },
  { id: 'savingAsset', label: 'Savings', sublabel: 'Dedicated savings account' },
  { id: 'ccAsset', label: 'Credit Card', sublabel: 'Credit card account' },
  { id: 'cashWalletAsset', label: 'Cash Wallet', sublabel: 'Physical cash' },
];

const LIABILITY_TYPES: { id: string; label: string }[] = [
  { id: 'loan', label: 'Loan' },
  { id: 'debt', label: 'Debt' },
  { id: 'mortgage', label: 'Mortgage' },
];

export default function AccountFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [type, setType] = useState('asset');
  const [role, setRole] = useState('defaultAsset');
  const [liabilityType, setLiabilityType] = useState('loan');
  const [currencyCode, setCurrencyCode] = useState('');
  const [currencyDisplay, setCurrencyDisplay] = useState('');
  const [iban, setIban] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const [showLiabilityPicker, setShowLiabilityPicker] = useState(false);

  const accountQuery = useQuery({ queryKey: ['account', id], queryFn: () => api.getAccount(id!), enabled: isEditing });
  const currenciesQuery = useQuery({ queryKey: ['currencies-all'], queryFn: async () => (await api.getCurrencies(1)).data });

  useEffect(() => {
    if (accountQuery.data?.data) {
      const attr = accountQuery.data.data.attributes;
      setName(attr.name || ''); setType(attr.type || 'asset'); setRole(attr.account_role || 'defaultAsset');
      setLiabilityType(attr.liability_type || 'loan'); setCurrencyCode(attr.currency_code || '');
      setCurrencyDisplay(attr.currency_code ? `${attr.currency_code} (${attr.currency_symbol || ''})` : '');
      setIban(attr.iban || ''); setAccountNumber(attr.account_number || '');
      setNotes(attr.notes || ''); setActive(attr.active !== false);
    }
  }, [accountQuery.data]);

  const currencyItems: PickerItem[] = useMemo(() => (currenciesQuery.data || []).map((c: any) => ({
    id: c.attributes.code, label: `${c.attributes.code} - ${c.attributes.name}`, sublabel: `Symbol: ${c.attributes.symbol}`, icon: 'currency-exchange',
  })), [currenciesQuery.data]);

  const roleItems: PickerItem[] = ASSET_ROLES.map((r) => ({
    id: r.id, label: r.label, sublabel: r.sublabel,
    icon: r.id === 'ccAsset' ? 'credit-card' : r.id === 'savingAsset' ? 'savings' : r.id === 'cashWalletAsset' ? 'account-balance-wallet' : 'account-balance',
  }));

  const liabilityItems: PickerItem[] = LIABILITY_TYPES.map((lt) => ({ id: lt.id, label: lt.label, icon: 'money-off' }));

  const selectedRoleInfo = ASSET_ROLES.find((r) => r.id === role);
  const selectedLiabilityInfo = LIABILITY_TYPES.find((lt) => lt.id === liabilityType);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter an account name'); return; }
    setSaving(true);
    try {
      const data: any = { name: name.trim(), type, iban: iban || undefined, account_number: accountNumber || undefined, notes: notes || undefined, active, currency_code: currencyCode || undefined };
      if (type === 'asset') data.account_role = role;
      if (type === 'liability') data.liability_type = liabilityType;
      if (!isEditing && openingBalance) { data.opening_balance = openingBalance; data.opening_balance_date = new Date().toISOString().split('T')[0]; }
      if (isEditing) { await api.updateAccount(id!, data); } else { await api.createAccount(data); }
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save account'); } finally { setSaving(false); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? 'Edit Account' : 'New Account'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          {/* Account Name */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="edit" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Account Name *" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
              </View>
            </View>
          </View>

          {/* Account Type */}
          {!isEditing ? (
            <View style={styles.typeSection}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>ACCOUNT TYPE</Text>
              <View style={styles.typeGrid}>
                {ACCOUNT_TYPES.map((t) => {
                  const active = type === t.id;
                  return (
                    <TouchableOpacity key={t.id} style={[styles.typeCard, { backgroundColor: active ? t.color + '14' : colors.surface, borderColor: active ? t.color : colors.border }]} onPress={() => setType(t.id)} activeOpacity={0.7}>
                      <View style={[styles.typeIconBg, { backgroundColor: active ? t.color + '20' : colors.border + '40' }]}>
                        <MaterialIcons name={t.icon as any} size={18} color={active ? t.color : colors.muted} />
                      </View>
                      <Text style={[styles.typeLabel, { color: active ? t.color : colors.muted }]}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}

          {/* Role / Liability Type / Currency */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {type === 'asset' ? (
              <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowRolePicker(true)} activeOpacity={0.6}>
                <View style={styles.fieldRow}>
                  <MaterialIcons name="badge" size={18} color={colors.muted} style={styles.fieldIcon} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Account Role</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>{selectedRoleInfo?.label || role}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ) : null}

            {type === 'liability' ? (
              <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowLiabilityPicker(true)} activeOpacity={0.6}>
                <View style={styles.fieldRow}>
                  <MaterialIcons name="money-off" size={18} color={colors.muted} style={styles.fieldIcon} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Liability Type</Text>
                    <Text style={[styles.fieldValue, { color: colors.foreground }]}>{selectedLiabilityInfo?.label || liabilityType}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity style={[styles.formField, { borderBottomWidth: 0 }]} onPress={() => setShowCurrencyPicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="currency-exchange" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Currency</Text>
                  <Text style={[styles.fieldValue, { color: currencyDisplay ? colors.foreground : colors.muted }]}>{currencyDisplay || currencyCode || 'Select...'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Details */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {!isEditing ? (
              <View style={[styles.formField, { borderBottomColor: colors.border }]}>
                <View style={styles.fieldRow}>
                  <MaterialIcons name="account-balance-wallet" size={18} color={colors.muted} style={styles.fieldIcon} />
                  <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Opening Balance" placeholderTextColor={colors.muted} value={openingBalance} onChangeText={setOpeningBalance} keyboardType="decimal-pad" returnKeyType="done" />
                </View>
              </View>
            ) : null}
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="credit-card" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="IBAN (optional)" placeholderTextColor={colors.muted} value={iban} onChangeText={setIban} autoCapitalize="characters" />
              </View>
            </View>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="tag" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Account Number (optional)" placeholderTextColor={colors.muted} value={accountNumber} onChangeText={setAccountNumber} />
              </View>
            </View>
          </View>

          {/* Notes & Active */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="notes" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground, minHeight: 50 }]} placeholder="Notes (optional)" placeholderTextColor={colors.muted} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" />
              </View>
            </View>
            <TouchableOpacity style={styles.formField} onPress={() => setActive(!active)} activeOpacity={0.7}>
              <View style={styles.fieldRow}>
                <MaterialIcons name={active ? 'toggle-on' : 'toggle-off'} size={26} color={active ? colors.primary : colors.muted} style={styles.fieldIcon} />
                <Text style={[styles.fieldValue, { color: colors.foreground }]}>Active Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PickerSheet visible={showCurrencyPicker} onClose={() => setShowCurrencyPicker(false)} title="Select Currency" items={currencyItems} selectedId={currencyCode} onSelect={(item) => { setCurrencyCode(item.id); setCurrencyDisplay(item.label); }} loading={currenciesQuery.isLoading} />
      <PickerSheet visible={showRolePicker} onClose={() => setShowRolePicker(false)} title="Account Role" items={roleItems} selectedId={role} onSelect={(item) => setRole(item.id)} searchable={false} />
      <PickerSheet visible={showLiabilityPicker} onClose={() => setShowLiabilityPicker(false)} title="Liability Type" items={liabilityItems} selectedId={liabilityType} onSelect={(item) => setLiabilityType(item.id)} searchable={false} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', marginLeft: 12, letterSpacing: -0.3 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4 },
  typeSection: { marginBottom: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeCard: { width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  typeIconBg: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 14, fontWeight: '600' },
  formSection: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  formField: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 12 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
});
