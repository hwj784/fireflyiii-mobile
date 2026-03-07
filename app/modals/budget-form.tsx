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
import { getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PickerSheet, PickerField, type PickerItem } from '@/components/ui/picker-sheet';

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

  const budgetQuery = useQuery({
    queryKey: ['budget', id],
    queryFn: () => api.getBudget(id!),
    enabled: isEditing,
  });

  const currenciesQuery = useQuery({
    queryKey: ['currencies-all'],
    queryFn: async () => {
      const res = await api.getCurrencies(1);
      return res.data;
    },
  });

  useEffect(() => {
    if (budgetQuery.data?.data) {
      const attr = budgetQuery.data.data.attributes;
      setName(attr.name || '');
      setNotes(attr.notes || '');
    }
  }, [budgetQuery.data]);

  const currencyItems: PickerItem[] = useMemo(() => {
    if (!currenciesQuery.data) return [];
    return currenciesQuery.data.map((c: any) => ({
      id: c.attributes.code,
      label: `${c.attributes.code} - ${c.attributes.name}`,
      sublabel: `Symbol: ${c.attributes.symbol}`,
      icon: 'currency-exchange',
    }));
  }, [currenciesQuery.data]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a budget name');
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await api.updateBudget(id!, { name: name.trim(), notes: notes || undefined });
      } else {
        const result = await api.createBudget({ name: name.trim(), notes: notes || undefined });
        if (limitAmount && parseFloat(limitAmount) > 0) {
          const budgetId = result.data.id;
          await api.createBudgetLimit(budgetId, {
            start: getStartOfMonth(),
            end: getEndOfMonth(),
            amount: limitAmount,
            currency_code: currencyCode || undefined,
          });
        }
      }
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget-limits'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground flex-1">
            {isEditing ? 'Edit Budget' : 'New Budget'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primary} /> : (
              <Text className="text-base font-semibold text-primary">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {/* Budget Name */}
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Budget Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="e.g. Groceries, Entertainment"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Monthly Limit */}
          {!isEditing ? (
            <>
              <View className="mb-4">
                <Text className="text-sm font-medium text-foreground mb-1">Monthly Limit</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={limitAmount}
                  onChangeText={setLimitAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Currency for Limit - Picker */}
              <PickerField
                label="Limit Currency"
                value={currencyDisplay || currencyCode}
                placeholder="Select currency (optional)..."
                onPress={() => setShowCurrencyPicker(true)}
                icon="currency-exchange"
              />
            </>
          ) : null}

          {/* Notes */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Notes</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Optional notes..."
              placeholderTextColor={colors.muted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Picker */}
      <PickerSheet
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        title="Select Currency"
        items={currencyItems}
        selectedId={currencyCode}
        onSelect={(item) => {
          setCurrencyCode(item.id);
          setCurrencyDisplay(item.label);
        }}
        loading={currenciesQuery.isLoading}
      />
    </ScreenContainer>
  );
}
