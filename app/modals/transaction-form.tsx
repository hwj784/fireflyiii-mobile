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
import { getToday } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PickerSheet, PickerField, MultiPickerField, type PickerItem } from '@/components/ui/picker-sheet';
import { DatePickerField } from '@/components/ui/date-picker';

const TX_TYPES = ['withdrawal', 'deposit', 'transfer'] as const;
const TX_LABELS: Record<string, string> = { withdrawal: 'Expense', deposit: 'Income', transfer: 'Transfer' };
const TX_ICONS: Record<string, string> = { withdrawal: 'arrow-downward', deposit: 'arrow-upward', transfer: 'swap-horiz' };

export default function TransactionFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [type, setType] = useState<string>('withdrawal');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [sourceAccount, setSourceAccount] = useState('');
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [destAccount, setDestAccount] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [category, setCategory] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [budget, setBudget] = useState('');
  const [budgetId, setBudgetId] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [date, setDate] = useState(getToday());
  const [notes, setNotes] = useState('');
  const [foreignAmount, setForeignAmount] = useState('');
  const [foreignCurrencyCode, setForeignCurrencyCode] = useState('');
  const [foreignCurrencyId, setForeignCurrencyId] = useState('');
  const [saving, setSaving] = useState(false);

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const txQuery = useQuery({ queryKey: ['transaction', id], queryFn: () => api.getTransaction(id!), enabled: isEditing });

  useEffect(() => {
    if (txQuery.data?.data) {
      const tx = txQuery.data.data.attributes?.transactions?.[0];
      if (tx) {
        setType(tx.type || 'withdrawal'); setAmount(tx.amount || ''); setDescription(tx.description || '');
        setSourceAccount(tx.source_name || ''); setSourceAccountId(tx.source_id || '');
        setDestAccount(tx.destination_name || ''); setDestAccountId(tx.destination_id || '');
        setCategory(tx.category_name || ''); setCategoryId(tx.category_id || '');
        setBudget(tx.budget_name || ''); setBudgetId(tx.budget_id || '');
        setSelectedTags(tx.tags || []); setDate(tx.date?.split('T')[0] || getToday());
        setNotes(tx.notes || ''); setForeignAmount(tx.foreign_amount || '');
        setForeignCurrencyCode(tx.foreign_currency_code || '');
      }
    }
  }, [txQuery.data]);

  const accountsQuery = useQuery({
    queryKey: ['accounts-all'],
    queryFn: async () => { const pages: any[] = []; let page = 1; let hasMore = true; while (hasMore && page <= 10) { const res = await api.getAccounts(page); pages.push(...res.data); hasMore = page < (res.meta?.pagination?.total_pages || 1); page++; } return pages; },
  });
  const categoriesQuery = useQuery({ queryKey: ['categories-all'], queryFn: async () => (await api.getCategories(1)).data });
  const budgetsQuery = useQuery({ queryKey: ['budgets-all'], queryFn: async () => (await api.getBudgets(1)).data });
  const tagsQuery = useQuery({ queryKey: ['tags-all'], queryFn: async () => (await api.getTags(1)).data });
  const currenciesQuery = useQuery({ queryKey: ['currencies-all'], queryFn: async () => (await api.getCurrencies(1)).data });

  const sourceAccountItems: PickerItem[] = useMemo(() => {
    if (!accountsQuery.data) return [];
    const typeFilter = type === 'deposit' ? 'revenue' : 'asset';
    return accountsQuery.data
      .filter((a: any) => type === 'transfer' ? a.attributes.type === 'asset' : a.attributes.type === typeFilter)
      .map((a: any) => ({ id: a.id, label: a.attributes.name, sublabel: `${a.attributes.currency_symbol || ''}${parseFloat(a.attributes.current_balance || 0).toFixed(2)} · ${a.attributes.type}`, icon: 'account-balance' }));
  }, [accountsQuery.data, type]);

  const destAccountItems: PickerItem[] = useMemo(() => {
    if (!accountsQuery.data) return [];
    const typeFilter = type === 'withdrawal' ? 'expense' : 'asset';
    return accountsQuery.data
      .filter((a: any) => type === 'transfer' ? a.attributes.type === 'asset' : a.attributes.type === typeFilter)
      .map((a: any) => ({ id: a.id, label: a.attributes.name, sublabel: `${a.attributes.currency_symbol || ''}${parseFloat(a.attributes.current_balance || 0).toFixed(2)} · ${a.attributes.type}`, icon: 'account-balance' }));
  }, [accountsQuery.data, type]);

  const categoryItems: PickerItem[] = useMemo(() => (categoriesQuery.data || []).map((c: any) => ({ id: c.id, label: c.attributes.name, icon: 'category' })), [categoriesQuery.data]);
  const budgetItems: PickerItem[] = useMemo(() => (budgetsQuery.data || []).map((b: any) => ({ id: b.id, label: b.attributes.name, icon: 'pie-chart' })), [budgetsQuery.data]);
  const tagItems: PickerItem[] = useMemo(() => (tagsQuery.data || []).map((t: any) => ({ id: t.attributes.tag, label: t.attributes.tag, icon: 'local-offer' })), [tagsQuery.data]);
  const currencyItems: PickerItem[] = useMemo(() => (currenciesQuery.data || []).map((c: any) => ({ id: c.attributes.code, label: `${c.attributes.code} - ${c.attributes.name}`, sublabel: c.attributes.symbol, icon: 'currency-exchange' })), [currenciesQuery.data]);

  const handleSave = async () => {
    if (!amount || !description) { Alert.alert('Error', 'Please fill in amount and description'); return; }
    setSaving(true);
    try {
      const txData: any = {
        transactions: [{ type, amount, description, date,
          source_id: sourceAccountId || undefined, source_name: sourceAccount || undefined,
          destination_id: destAccountId || undefined, destination_name: destAccount || undefined,
          category_name: category || undefined, budget_name: budget || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined, notes: notes || undefined,
          foreign_amount: foreignAmount || undefined, foreign_currency_code: foreignCurrencyCode || undefined,
        }],
      };
      if (isEditing) { await api.updateTransaction(id!, txData); } else { await api.createTransaction(txData); }
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save transaction'); } finally { setSaving(false); }
  };

  const typeColors: Record<string, string> = { withdrawal: colors.error, deposit: colors.success, transfer: colors.primary };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          {/* Type Selector */}
          <View style={styles.typeRow}>
            {TX_TYPES.map((t) => {
              const active = type === t;
              const tColor = typeColors[t];
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeBtn, { backgroundColor: active ? tColor + '14' : colors.surface, borderColor: active ? tColor : colors.border }]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name={TX_ICONS[t] as any} size={16} color={active ? tColor : colors.muted} />
                  <Text style={[styles.typeText, { color: active ? tColor : colors.muted }]}>{TX_LABELS[t]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Amount Hero */}
          <View style={[styles.amountCard, { backgroundColor: typeColors[type] + '08', borderColor: typeColors[type] + '20' }]}>
            <Text style={[styles.amountLabel, { color: colors.muted }]}>Amount</Text>
            <TextInput
              style={[styles.amountInput, { color: typeColors[type] }]}
              placeholder="0.00"
              placeholderTextColor={typeColors[type] + '40'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>

          {/* Form Section */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {/* Description */}
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="edit" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground }]}
                  placeholder="Description *"
                  placeholderTextColor={colors.muted}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>
            </View>

            {/* Source Account */}
            <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowSourcePicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="account-balance" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>{type === 'deposit' ? 'Revenue Account' : 'Source Account'}</Text>
                  <Text style={[styles.fieldValue, { color: sourceAccount ? colors.foreground : colors.muted }]} numberOfLines={1}>{sourceAccount || 'Select...'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* Destination Account */}
            <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowDestPicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="account-balance" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>{type === 'withdrawal' ? 'Expense Account' : 'Destination Account'}</Text>
                  <Text style={[styles.fieldValue, { color: destAccount ? colors.foreground : colors.muted }]} numberOfLines={1}>{destAccount || 'Select...'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* Date */}
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <DatePickerField label="Date" value={date} onChange={setDate} />
            </View>

            {/* Category */}
            <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowCategoryPicker(true)} activeOpacity={0.6}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="category" size={18} color={colors.muted} style={styles.fieldIcon} />
                <View style={styles.fieldContent}>
                  <Text style={[styles.fieldLabel, { color: colors.muted }]}>Category</Text>
                  <Text style={[styles.fieldValue, { color: category ? colors.foreground : colors.muted }]} numberOfLines={1}>{category || 'Select...'}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
              </View>
            </TouchableOpacity>

            {/* Budget (only for withdrawals) */}
            {type === 'withdrawal' ? (
              <TouchableOpacity style={[styles.formField, { borderBottomColor: colors.border }]} onPress={() => setShowBudgetPicker(true)} activeOpacity={0.6}>
                <View style={styles.fieldRow}>
                  <MaterialIcons name="pie-chart" size={18} color={colors.muted} style={styles.fieldIcon} />
                  <View style={styles.fieldContent}>
                    <Text style={[styles.fieldLabel, { color: colors.muted }]}>Budget</Text>
                    <Text style={[styles.fieldValue, { color: budget ? colors.foreground : colors.muted }]} numberOfLines={1}>{budget || 'Select...'}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={18} color={colors.muted} />
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Tags */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MultiPickerField label="Tags" values={selectedTags} placeholder="Select tags..." onPress={() => setShowTagPicker(true)} onRemove={(tag) => setSelectedTags((prev) => prev.filter((t) => t !== tag))} />
          </View>

          {/* Notes */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="notes" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground, minHeight: 60 }]}
                  placeholder="Notes..."
                  placeholderTextColor={colors.muted}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          {/* Foreign Amount */}
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="currency-exchange" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput
                  style={[styles.fieldInput, { color: colors.foreground, flex: 1 }]}
                  placeholder="Foreign amount (optional)"
                  placeholderTextColor={colors.muted}
                  value={foreignAmount}
                  onChangeText={setForeignAmount}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowCurrencyPicker(true)} style={[styles.currencyBadge, { backgroundColor: colors.primary + '14' }]}>
                  <Text style={[styles.currencyText, { color: colors.primary }]}>{foreignCurrencyCode || 'Currency'}</Text>
                  <MaterialIcons name="keyboard-arrow-down" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker Sheets */}
      <PickerSheet visible={showSourcePicker} onClose={() => setShowSourcePicker(false)} title={type === 'deposit' ? 'Revenue Account' : 'Source Account'} items={sourceAccountItems} selectedId={sourceAccountId} onSelect={(item) => { setSourceAccount(item.label); setSourceAccountId(item.id); }} allowCustom customPlaceholder="Enter account name..." onCustomSubmit={(val) => { setSourceAccount(val); setSourceAccountId(''); }} loading={accountsQuery.isLoading} />
      <PickerSheet visible={showDestPicker} onClose={() => setShowDestPicker(false)} title={type === 'withdrawal' ? 'Expense Account' : 'Destination Account'} items={destAccountItems} selectedId={destAccountId} onSelect={(item) => { setDestAccount(item.label); setDestAccountId(item.id); }} allowCustom customPlaceholder="Enter account name..." onCustomSubmit={(val) => { setDestAccount(val); setDestAccountId(''); }} loading={accountsQuery.isLoading} />
      <PickerSheet visible={showCategoryPicker} onClose={() => setShowCategoryPicker(false)} title="Select Category" items={categoryItems} selectedId={categoryId} onSelect={(item) => { setCategory(item.label); setCategoryId(item.id); }} allowCustom customPlaceholder="Enter new category..." onCustomSubmit={(val) => { setCategory(val); setCategoryId(''); }} loading={categoriesQuery.isLoading} />
      <PickerSheet visible={showBudgetPicker} onClose={() => setShowBudgetPicker(false)} title="Select Budget" items={budgetItems} selectedId={budgetId} onSelect={(item) => { setBudget(item.label); setBudgetId(item.id); }} loading={budgetsQuery.isLoading} />
      <PickerSheet visible={showTagPicker} onClose={() => setShowTagPicker(false)} title="Select Tags" items={tagItems} selectedIds={selectedTags} multiSelect onSelect={() => {}} onMultiSelect={(items) => setSelectedTags(items.map((i) => i.label))} allowCustom customPlaceholder="Enter new tag..." onCustomSubmit={(val) => setSelectedTags((prev) => [...prev, val])} loading={tagsQuery.isLoading} />
      <PickerSheet visible={showCurrencyPicker} onClose={() => setShowCurrencyPicker(false)} title="Select Currency" items={currencyItems} selectedId={foreignCurrencyCode} onSelect={(item) => { setForeignCurrencyCode(item.id); setForeignCurrencyId(item.id); }} loading={currenciesQuery.isLoading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', marginLeft: 12, letterSpacing: -0.3 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, borderWidth: 1, gap: 6 },
  typeText: { fontSize: 13, fontWeight: '600' },
  amountCard: { borderRadius: 18, borderWidth: 1, padding: 20, marginBottom: 16, alignItems: 'center' },
  amountLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  amountInput: { fontSize: 36, fontWeight: '800', textAlign: 'center', letterSpacing: -1, width: '100%' },
  formSection: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  formField: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 12 },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  fieldValue: { fontSize: 15, fontWeight: '500' },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  currencyBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  currencyText: { fontSize: 13, fontWeight: '600' },
});
