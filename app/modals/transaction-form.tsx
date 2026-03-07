import React, { useState, useEffect, useMemo } from 'react';
import {
  Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
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

  // Picker visibility states
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestPicker, setShowDestPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showBudgetPicker, setShowBudgetPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Load existing transaction for editing
  const txQuery = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.getTransaction(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (txQuery.data?.data) {
      const tx = txQuery.data.data.attributes?.transactions?.[0];
      if (tx) {
        setType(tx.type || 'withdrawal');
        setAmount(tx.amount || '');
        setDescription(tx.description || '');
        setSourceAccount(tx.source_name || '');
        setSourceAccountId(tx.source_id || '');
        setDestAccount(tx.destination_name || '');
        setDestAccountId(tx.destination_id || '');
        setCategory(tx.category_name || '');
        setCategoryId(tx.category_id || '');
        setBudget(tx.budget_name || '');
        setBudgetId(tx.budget_id || '');
        setSelectedTags(tx.tags || []);
        setDate(tx.date?.split('T')[0] || getToday());
        setNotes(tx.notes || '');
        setForeignAmount(tx.foreign_amount || '');
        setForeignCurrencyCode(tx.foreign_currency_code || '');
      }
    }
  }, [txQuery.data]);

  // Fetch data for pickers
  const accountsQuery = useQuery({
    queryKey: ['accounts-all'],
    queryFn: async () => {
      const pages: any[] = [];
      let page = 1;
      let hasMore = true;
      while (hasMore && page <= 10) {
        const res = await api.getAccounts(page);
        pages.push(...res.data);
        hasMore = page < (res.meta?.pagination?.total_pages || 1);
        page++;
      }
      return pages;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const res = await api.getCategories(1);
      return res.data;
    },
  });

  const budgetsQuery = useQuery({
    queryKey: ['budgets-all'],
    queryFn: async () => {
      const res = await api.getBudgets(1);
      return res.data;
    },
  });

  const tagsQuery = useQuery({
    queryKey: ['tags-all'],
    queryFn: async () => {
      const res = await api.getTags(1);
      return res.data;
    },
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies-all'],
    queryFn: async () => {
      const res = await api.getCurrencies(1);
      return res.data;
    },
  });

  // Build picker items
  const sourceAccountItems: PickerItem[] = useMemo(() => {
    if (!accountsQuery.data) return [];
    const accounts = accountsQuery.data;
    const typeFilter = type === 'deposit' ? 'revenue' : 'asset';
    return accounts
      .filter((a: any) => type === 'transfer' ? a.attributes.type === 'asset' : a.attributes.type === typeFilter)
      .map((a: any) => ({
        id: a.id,
        label: a.attributes.name,
        sublabel: `${a.attributes.currency_symbol || ''}${parseFloat(a.attributes.current_balance || 0).toFixed(2)} · ${a.attributes.type}`,
        icon: 'account-balance',
      }));
  }, [accountsQuery.data, type]);

  const destAccountItems: PickerItem[] = useMemo(() => {
    if (!accountsQuery.data) return [];
    const accounts = accountsQuery.data;
    const typeFilter = type === 'withdrawal' ? 'expense' : 'asset';
    return accounts
      .filter((a: any) => type === 'transfer' ? a.attributes.type === 'asset' : a.attributes.type === typeFilter)
      .map((a: any) => ({
        id: a.id,
        label: a.attributes.name,
        sublabel: `${a.attributes.currency_symbol || ''}${parseFloat(a.attributes.current_balance || 0).toFixed(2)} · ${a.attributes.type}`,
        icon: 'account-balance',
      }));
  }, [accountsQuery.data, type]);

  const categoryItems: PickerItem[] = useMemo(() => {
    if (!categoriesQuery.data) return [];
    return categoriesQuery.data.map((c: any) => ({
      id: c.id,
      label: c.attributes.name,
      icon: 'category',
    }));
  }, [categoriesQuery.data]);

  const budgetItems: PickerItem[] = useMemo(() => {
    if (!budgetsQuery.data) return [];
    return budgetsQuery.data.map((b: any) => ({
      id: b.id,
      label: b.attributes.name,
      icon: 'pie-chart',
    }));
  }, [budgetsQuery.data]);

  const tagItems: PickerItem[] = useMemo(() => {
    if (!tagsQuery.data) return [];
    return tagsQuery.data.map((t: any) => ({
      id: t.attributes.tag,
      label: t.attributes.tag,
      icon: 'local-offer',
    }));
  }, [tagsQuery.data]);

  const currencyItems: PickerItem[] = useMemo(() => {
    if (!currenciesQuery.data) return [];
    return currenciesQuery.data.map((c: any) => ({
      id: c.attributes.code,
      label: `${c.attributes.code} - ${c.attributes.name}`,
      sublabel: c.attributes.symbol,
      icon: 'currency-exchange',
    }));
  }, [currenciesQuery.data]);

  const handleSave = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in amount and description');
      return;
    }

    setSaving(true);
    try {
      const txData: any = {
        transactions: [{
          type,
          amount,
          description,
          date,
          source_id: sourceAccountId || undefined,
          source_name: sourceAccount || undefined,
          destination_id: destAccountId || undefined,
          destination_name: destAccount || undefined,
          category_name: category || undefined,
          budget_name: budget || undefined,
          tags: selectedTags.length > 0 ? selectedTags : undefined,
          notes: notes || undefined,
          foreign_amount: foreignAmount || undefined,
          foreign_currency_code: foreignCurrencyCode || undefined,
        }],
      };

      if (isEditing) {
        await api.updateTransaction(id!, txData);
      } else {
        await api.createTransaction(txData);
      }

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['summary'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const typeColors: Record<string, string> = {
    withdrawal: colors.error,
    deposit: colors.success,
    transfer: colors.primary,
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground flex-1">
            {isEditing ? 'Edit Transaction' : 'New Transaction'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text className="text-base font-semibold text-primary">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {/* Type Selector */}
          <View className="flex-row gap-2 my-4">
            {TX_TYPES.map((t) => (
              <TouchableOpacity
                key={t}
                className="flex-1 py-2.5 rounded-xl items-center border"
                style={{
                  backgroundColor: type === t ? typeColors[t] + '18' : 'transparent',
                  borderColor: type === t ? typeColors[t] : colors.border,
                }}
                onPress={() => setType(t)}
              >
                <Text
                  className="text-sm font-medium capitalize"
                  style={{ color: type === t ? typeColors[t] : colors.muted }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Amount *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-2xl font-bold text-foreground text-center"
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              style={{ color: typeColors[type] }}
            />
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Description *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="What was this for?"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Source Account - Picker */}
          <PickerField
            label={type === 'deposit' ? 'Revenue Account' : 'Source Account'}
            value={sourceAccount}
            placeholder="Select account..."
            onPress={() => setShowSourcePicker(true)}
            icon="account-balance"
          />

          {/* Destination Account - Picker */}
          <PickerField
            label={type === 'withdrawal' ? 'Expense Account' : 'Destination Account'}
            value={destAccount}
            placeholder="Select account..."
            onPress={() => setShowDestPicker(true)}
            icon="account-balance"
          />

          {/* Date - Calendar Picker */}
          <DatePickerField
            label="Date"
            value={date}
            onChange={setDate}
          />

          {/* Category - Picker */}
          <PickerField
            label="Category"
            value={category}
            placeholder="Select category..."
            onPress={() => setShowCategoryPicker(true)}
            icon="category"
          />

          {/* Budget - Picker (only for withdrawals) */}
          {type === 'withdrawal' ? (
            <PickerField
              label="Budget"
              value={budget}
              placeholder="Select budget..."
              onPress={() => setShowBudgetPicker(true)}
              icon="pie-chart"
            />
          ) : null}

          {/* Tags - Multi Picker */}
          <MultiPickerField
            label="Tags"
            values={selectedTags}
            placeholder="Select tags..."
            onPress={() => setShowTagPicker(true)}
            onRemove={(tag) => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
          />

          {/* Notes */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Notes</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Additional notes..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Foreign Amount */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Foreign Amount (optional)</Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={foreignAmount}
                onChangeText={setForeignAmount}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity
                className="w-28 bg-surface border border-border rounded-xl px-3 py-3 flex-row items-center justify-between"
                onPress={() => setShowCurrencyPicker(true)}
                activeOpacity={0.7}
              >
                <Text className={`text-base ${foreignCurrencyCode ? 'text-foreground font-medium' : 'text-muted'}`}>
                  {foreignCurrencyCode || 'Currency'}
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker Sheets */}
      <PickerSheet
        visible={showSourcePicker}
        onClose={() => setShowSourcePicker(false)}
        title={type === 'deposit' ? 'Select Revenue Account' : 'Select Source Account'}
        items={sourceAccountItems}
        selectedId={sourceAccountId}
        onSelect={(item) => { setSourceAccount(item.label); setSourceAccountId(item.id); }}
        allowCustom
        customPlaceholder="Enter account name..."
        onCustomSubmit={(val) => { setSourceAccount(val); setSourceAccountId(''); }}
        loading={accountsQuery.isLoading}
      />

      <PickerSheet
        visible={showDestPicker}
        onClose={() => setShowDestPicker(false)}
        title={type === 'withdrawal' ? 'Select Expense Account' : 'Select Destination Account'}
        items={destAccountItems}
        selectedId={destAccountId}
        onSelect={(item) => { setDestAccount(item.label); setDestAccountId(item.id); }}
        allowCustom
        customPlaceholder="Enter account name..."
        onCustomSubmit={(val) => { setDestAccount(val); setDestAccountId(''); }}
        loading={accountsQuery.isLoading}
      />

      <PickerSheet
        visible={showCategoryPicker}
        onClose={() => setShowCategoryPicker(false)}
        title="Select Category"
        items={categoryItems}
        selectedId={categoryId}
        onSelect={(item) => { setCategory(item.label); setCategoryId(item.id); }}
        allowCustom
        customPlaceholder="Enter new category..."
        onCustomSubmit={(val) => { setCategory(val); setCategoryId(''); }}
        loading={categoriesQuery.isLoading}
      />

      <PickerSheet
        visible={showBudgetPicker}
        onClose={() => setShowBudgetPicker(false)}
        title="Select Budget"
        items={budgetItems}
        selectedId={budgetId}
        onSelect={(item) => { setBudget(item.label); setBudgetId(item.id); }}
        loading={budgetsQuery.isLoading}
      />

      <PickerSheet
        visible={showTagPicker}
        onClose={() => setShowTagPicker(false)}
        title="Select Tags"
        items={tagItems}
        selectedIds={selectedTags}
        multiSelect
        onSelect={() => {}}
        onMultiSelect={(items) => setSelectedTags(items.map((i) => i.label))}
        allowCustom
        customPlaceholder="Enter new tag..."
        onCustomSubmit={(val) => setSelectedTags((prev) => [...prev, val])}
        loading={tagsQuery.isLoading}
      />

      <PickerSheet
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Select Currency"
        items={currencyItems}
        selectedId={foreignCurrencyCode}
        onSelect={(item) => { setForeignCurrencyCode(item.id); setForeignCurrencyId(item.id); }}
        loading={currenciesQuery.isLoading}
      />
    </ScreenContainer>
  );
}
