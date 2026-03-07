import React, { useState, useEffect } from 'react';
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

const ACCOUNT_TYPES = ['asset', 'expense', 'revenue', 'liability'];
const ASSET_ROLES = ['defaultAsset', 'savingAsset', 'ccAsset', 'cashWalletAsset'];
const LIABILITY_TYPES = ['loan', 'debt', 'mortgage'];

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
  const [iban, setIban] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const accountQuery = useQuery({
    queryKey: ['account', id],
    queryFn: () => api.getAccount(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (accountQuery.data?.data) {
      const attr = accountQuery.data.data.attributes;
      setName(attr.name || '');
      setType(attr.type || 'asset');
      setRole(attr.account_role || 'defaultAsset');
      setLiabilityType(attr.liability_type || 'loan');
      setCurrencyCode(attr.currency_code || '');
      setIban(attr.iban || '');
      setAccountNumber(attr.account_number || '');
      setNotes(attr.notes || '');
      setActive(attr.active !== false);
    }
  }, [accountQuery.data]);

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

          {!isEditing ? (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1">Account Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    className={`px-3 py-2 rounded-xl border ${type === t ? 'bg-primary/10 border-primary' : 'border-border'}`}
                    onPress={() => setType(t)}
                  >
                    <Text className={`text-sm capitalize ${type === t ? 'text-primary font-medium' : 'text-muted'}`}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {type === 'asset' ? (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1">Role</Text>
              <View className="flex-row flex-wrap gap-2">
                {ASSET_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r}
                    className={`px-3 py-2 rounded-xl border ${role === r ? 'bg-primary/10 border-primary' : 'border-border'}`}
                    onPress={() => setRole(r)}
                  >
                    <Text className={`text-xs ${role === r ? 'text-primary font-medium' : 'text-muted'}`}>
                      {r.replace(/([A-Z])/g, ' $1').trim()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          {type === 'liability' ? (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1">Liability Type</Text>
              <View className="flex-row gap-2">
                {LIABILITY_TYPES.map((lt) => (
                  <TouchableOpacity
                    key={lt}
                    className={`px-3 py-2 rounded-xl border ${liabilityType === lt ? 'bg-primary/10 border-primary' : 'border-border'}`}
                    onPress={() => setLiabilityType(lt)}
                  >
                    <Text className={`text-sm capitalize ${liabilityType === lt ? 'text-primary font-medium' : 'text-muted'}`}>{lt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Currency Code</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="EUR, USD, etc."
              placeholderTextColor={colors.muted}
              value={currencyCode}
              onChangeText={setCurrencyCode}
              autoCapitalize="characters"
            />
          </View>

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

          <TouchableOpacity
            className="flex-row items-center mb-4"
            onPress={() => setActive(!active)}
          >
            <MaterialIcons name={active ? 'check-box' : 'check-box-outline-blank'} size={24} color={colors.primary} />
            <Text className="text-base text-foreground ml-2">Active</Text>
          </TouchableOpacity>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
