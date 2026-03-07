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

const ACCOUNT_TYPES: { id: string; label: string; icon: string }[] = [
  { id: 'asset', label: 'Asset', icon: 'account-balance' },
  { id: 'expense', label: 'Expense', icon: 'shopping-cart' },
  { id: 'revenue', label: 'Revenue', icon: 'trending-up' },
  { id: 'liability', label: 'Liability', icon: 'money-off' },
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

  const accountQuery = useQuery({
    queryKey: ['account', id],
    queryFn: () => api.getAccount(id!),
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
    if (accountQuery.data?.data) {
      const attr = accountQuery.data.data.attributes;
      setName(attr.name || '');
      setType(attr.type || 'asset');
      setRole(attr.account_role || 'defaultAsset');
      setLiabilityType(attr.liability_type || 'loan');
      setCurrencyCode(attr.currency_code || '');
      setCurrencyDisplay(attr.currency_code ? `${attr.currency_code} (${attr.currency_symbol || ''})` : '');
      setIban(attr.iban || '');
      setAccountNumber(attr.account_number || '');
      setNotes(attr.notes || '');
      setActive(attr.active !== false);
    }
  }, [accountQuery.data]);

  const currencyItems: PickerItem[] = useMemo(() => {
    if (!currenciesQuery.data) return [];
    return currenciesQuery.data.map((c: any) => ({
      id: c.attributes.code,
      label: `${c.attributes.code} - ${c.attributes.name}`,
      sublabel: `Symbol: ${c.attributes.symbol}`,
      icon: 'currency-exchange',
    }));
  }, [currenciesQuery.data]);

  const roleItems: PickerItem[] = ASSET_ROLES.map((r) => ({
    id: r.id,
    label: r.label,
    sublabel: r.sublabel,
    icon: r.id === 'ccAsset' ? 'credit-card' : r.id === 'savingAsset' ? 'savings' : r.id === 'cashWalletAsset' ? 'account-balance-wallet' : 'account-balance',
  }));

  const liabilityItems: PickerItem[] = LIABILITY_TYPES.map((lt) => ({
    id: lt.id,
    label: lt.label,
    icon: 'money-off',
  }));

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    setSaving(true);
    try {
      const data: any = {
        name: name.trim(),
        type,
        iban: iban || undefined,
        account_number: accountNumber || undefined,
        notes: notes || undefined,
        active,
        currency_code: currencyCode || undefined,
      };

      if (type === 'asset') {
        data.account_role = role;
      }
      if (type === 'liability') {
        data.liability_type = liabilityType;
      }
      if (!isEditing && openingBalance) {
        data.opening_balance = openingBalance;
        data.opening_balance_date = new Date().toISOString().split('T')[0];
      }

      if (isEditing) {
        await api.updateAccount(id!, data);
      } else {
        await api.createAccount(data);
      }

      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const selectedTypeInfo = ACCOUNT_TYPES.find((t) => t.id === type);
  const selectedRoleInfo = ASSET_ROLES.find((r) => r.id === role);
  const selectedLiabilityInfo = LIABILITY_TYPES.find((lt) => lt.id === liabilityType);

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <MaterialIcons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground flex-1">
            {isEditing ? 'Edit Account' : 'New Account'}
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primary} /> : (
              <Text className="text-base font-semibold text-primary">Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          {/* Account Name */}
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Account Name *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="My Account"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Account Type - Chip selector */}
          {!isEditing ? (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Account Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    className="flex-row items-center px-4 py-2.5 rounded-xl border"
                    style={{
                      backgroundColor: type === t.id ? colors.primary + '15' : 'transparent',
                      borderColor: type === t.id ? colors.primary : colors.border,
                    }}
                    onPress={() => setType(t.id)}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons
                      name={t.icon as any}
                      size={16}
                      color={type === t.id ? colors.primary : colors.muted}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      className="text-sm font-medium"
                      style={{ color: type === t.id ? colors.primary : colors.muted }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {/* Asset Role - Picker */}
          {type === 'asset' ? (
            <PickerField
              label="Account Role"
              value={selectedRoleInfo?.label || role}
              placeholder="Select role..."
              onPress={() => setShowRolePicker(true)}
              icon="badge"
            />
          ) : null}

          {/* Liability Type - Picker */}
          {type === 'liability' ? (
            <PickerField
              label="Liability Type"
              value={selectedLiabilityInfo?.label || liabilityType}
              placeholder="Select type..."
              onPress={() => setShowLiabilityPicker(true)}
              icon="money-off"
            />
          ) : null}

          {/* Currency - Picker */}
          <PickerField
            label="Currency"
            value={currencyDisplay || currencyCode}
            placeholder="Select currency..."
            onPress={() => setShowCurrencyPicker(true)}
            icon="currency-exchange"
          />

          {/* Opening Balance */}
          {!isEditing ? (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1">Opening Balance</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                value={openingBalance}
                onChangeText={setOpeningBalance}
                keyboardType="decimal-pad"
              />
            </View>
          ) : null}

          {/* IBAN */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">IBAN</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Optional"
              placeholderTextColor={colors.muted}
              value={iban}
              onChangeText={setIban}
              autoCapitalize="characters"
            />
          </View>

          {/* Account Number */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Account Number</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Optional"
              placeholderTextColor={colors.muted}
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
          </View>

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

          {/* Active toggle */}
          <TouchableOpacity
            className="flex-row items-center mb-4 bg-surface border border-border rounded-xl px-4 py-3"
            onPress={() => setActive(!active)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={active ? 'toggle-on' : 'toggle-off'}
              size={28}
              color={active ? colors.primary : colors.muted}
            />
            <Text className="text-base text-foreground ml-3">Active Account</Text>
          </TouchableOpacity>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Picker Sheets */}
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

      <PickerSheet
        visible={showRolePicker}
        onClose={() => setShowRolePicker(false)}
        title="Select Account Role"
        items={roleItems}
        selectedId={role}
        onSelect={(item) => setRole(item.id)}
        searchable={false}
      />

      <PickerSheet
        visible={showLiabilityPicker}
        onClose={() => setShowLiabilityPicker(false)}
        title="Select Liability Type"
        items={liabilityItems}
        selectedId={liabilityType}
        onSelect={(item) => setLiabilityType(item.id)}
        searchable={false}
      />
    </ScreenContainer>
  );
}
