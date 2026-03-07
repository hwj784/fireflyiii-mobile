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

  const piggyQuery = useQuery({
    queryKey: ['piggy-bank', id],
    queryFn: () => api.getPiggyBank(id!),
    enabled: isEditing,
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts-asset'],
    queryFn: async () => {
      const res = await api.getAccounts(1, 'asset');
      return res.data;
    },
  });

  useEffect(() => {
    if (piggyQuery.data?.data) {
      const attr = piggyQuery.data.data.attributes;
      setName(attr.name || '');
      setAccountId(String(attr.account_id || ''));
      setAccountName(attr.account_name || '');
      setTargetAmount(attr.target_amount || '');
      setNotes(attr.notes || '');
      setTargetDate(attr.target_date?.split('T')[0] || '');
    }
  }, [piggyQuery.data]);

  const accountItems: PickerItem[] = useMemo(() => {
    if (!accountsQuery.data) return [];
    return accountsQuery.data.map((a: any) => ({
      id: String(a.id),
      label: a.attributes.name,
      sublabel: `${a.attributes.currency_symbol || ''}${parseFloat(a.attributes.current_balance || 0).toFixed(2)}`,
      icon: a.attributes.account_role === 'savingAsset' ? 'savings' :
            a.attributes.account_role === 'ccAsset' ? 'credit-card' : 'account-balance',
    }));
  }, [accountsQuery.data]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a name'); return; }
    if (!accountId && !isEditing) { Alert.alert('Error', 'Please select an account'); return; }
    setSaving(true);
    try {
      const data: any = {
        name: name.trim(),
        account_id: accountId || undefined,
        target_amount: targetAmount || null,
        notes: notes || undefined,
        target_date: targetDate || undefined,
      };
      if (isEditing) { await api.updatePiggyBank(id!, data); }
      else { await api.createPiggyBank(data); }
      queryClient.invalidateQueries({ queryKey: ['piggy-banks'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground flex-1">{isEditing ? 'Edit Piggy Bank' : 'New Piggy Bank'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primary} /> : <Text className="text-base font-semibold text-primary">Save</Text>}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {/* Name */}
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="e.g. Vacation Fund"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Linked Account - Picker */}
          <PickerField
            label="Linked Account"
            value={accountName}
            placeholder="Select asset account..."
            onPress={() => setShowAccountPicker(true)}
            required={!isEditing}
            icon="account-balance"
          />

          {/* Target Amount */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Target Amount</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Target Date - Calendar Picker */}
          <DatePickerField
            label="Target Date"
            value={targetDate}
            onChange={setTargetDate}
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

      {/* Account Picker */}
      <PickerSheet
        visible={showAccountPicker}
        onClose={() => setShowAccountPicker(false)}
        title="Select Asset Account"
        items={accountItems}
        selectedId={accountId}
        onSelect={(item) => {
          setAccountId(item.id);
          setAccountName(item.label);
        }}
        loading={accountsQuery.isLoading}
      />
    </ScreenContainer>
  );
}
