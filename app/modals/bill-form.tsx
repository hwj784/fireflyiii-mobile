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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PickerSheet, PickerField, type PickerItem } from '@/components/ui/picker-sheet';
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

  const billQuery = useQuery({
    queryKey: ['bill', id],
    queryFn: () => api.getBill(id!),
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
    if (billQuery.data?.data) {
      const attr = billQuery.data.data.attributes;
      setName(attr.name || '');
      setAmountMin(attr.amount_min || '');
      setAmountMax(attr.amount_max || '');
      setDate(attr.date?.split('T')[0] || '');
      setRepeatFreq(attr.repeat_freq || 'monthly');
      setCurrencyCode(attr.currency_code || '');
      if (attr.currency_code) {
        setCurrencyDisplay(`${attr.currency_code} (${attr.currency_symbol || ''})`);
      }
      setNotes(attr.notes || '');
    }
  }, [billQuery.data]);

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
    if (!name.trim() || !amountMin || !amountMax) {
      Alert.alert('Error', 'Please fill in name and amount range');
      return;
    }
    setSaving(true);
    try {
      const data: any = {
        name: name.trim(),
        amount_min: amountMin,
        amount_max: amountMax,
        date: date || new Date().toISOString().split('T')[0],
        repeat_freq: repeatFreq,
        currency_code: currencyCode || undefined,
        notes: notes || undefined,
      };
      if (isEditing) { await api.updateBill(id!, data); }
      else { await api.createBill(data); }
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const selectedFreqLabel = REPEAT_FREQS.find((f) => f.id === repeatFreq)?.label || repeatFreq;

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground flex-1">{isEditing ? 'Edit Bill' : 'New Bill'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primary} /> : <Text className="text-base font-semibold text-primary">Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {/* Bill Name */}
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Bill Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="e.g. Netflix, Rent"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Currency - Picker */}
          <PickerField
            label="Currency"
            value={currencyDisplay || currencyCode}
            placeholder="Select currency..."
            onPress={() => setShowCurrencyPicker(true)}
            icon="currency-exchange"
          />

          {/* Amount Range */}
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground mb-1">Min Amount *</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={amountMin}
                onChangeText={setAmountMin}
                keyboardType="decimal-pad"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground mb-1">Max Amount *</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={amountMax}
                onChangeText={setAmountMax}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Start Date - Calendar Picker */}
          <DatePickerField
            label="Start Date"
            value={date}
            onChange={setDate}
          />

          {/* Frequency - Picker */}
          <PickerField
            label="Frequency"
            value={selectedFreqLabel}
            placeholder="Select frequency..."
            onPress={() => setShowFreqPicker(true)}
            icon="event-repeat"
          />

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

      {/* Picker Sheets */}
      <PickerSheet
        visible={showFreqPicker}
        onClose={() => setShowFreqPicker(false)}
        title="Select Frequency"
        items={REPEAT_FREQS}
        selectedId={repeatFreq}
        onSelect={(item) => setRepeatFreq(item.id)}
        searchable={false}
      />

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
