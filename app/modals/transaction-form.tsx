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
import { getToday } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
  const [budget, setBudget] = useState('');
  const [tags, setTags] = useState('');
  const [date, setDate] = useState(getToday());
  const [notes, setNotes] = useState('');
  const [foreignAmount, setForeignAmount] = useState('');
  const [foreignCurrencyCode, setForeignCurrencyCode] = useState('');
  const [saving, setSaving] = useState(false);

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
        setBudget(tx.budget_name || '');
        setTags(tx.tags?.join(', ') || '');
        setDate(tx.date?.split('T')[0] || getToday());
        setNotes(tx.notes || '');
        setForeignAmount(tx.foreign_amount || '');
        setForeignCurrencyCode(tx.foreign_currency_code || '');
      }
    }
  }, [txQuery.data]);

  // Autocomplete suggestions
  const [showSourceSuggestions, setShowSourceSuggestions] = useState(false);
  const [showDestSuggestions, setShowDestSuggestions] = useState(false);

  const sourceQuery = useQuery({
    queryKey: ['autocomplete', 'accounts', sourceAccount, type],
    queryFn: () => {
      const accountTypes = type === 'withdrawal' ? 'Asset account' : type === 'deposit' ? 'Revenue account' : 'Asset account';
      return api.autocomplete('accounts', sourceAccount, { types: accountTypes });
    },
    enabled: sourceAccount.length > 0 && showSourceSuggestions,
  });

  const destQuery = useQuery({
    queryKey: ['autocomplete', 'accounts-dest', destAccount, type],
    queryFn: () => {
      const accountTypes = type === 'withdrawal' ? 'Expense account' : type === 'deposit' ? 'Asset account' : 'Asset account';
      return api.autocomplete('accounts', destAccount, { types: accountTypes });
    },
    enabled: destAccount.length > 0 && showDestSuggestions,
  });

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
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
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
                className={`flex-1 py-2.5 rounded-xl items-center border`}
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

          {/* Source Account */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">
              {type === 'deposit' ? 'Revenue Account' : 'Source Account'}
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Search account..."
              placeholderTextColor={colors.muted}
              value={sourceAccount}
              onChangeText={(text) => { setSourceAccount(text); setSourceAccountId(''); setShowSourceSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSourceSuggestions(false), 200)}
            />
            {showSourceSuggestions && (sourceQuery.data || []).length > 0 ? (
              <View className="bg-surface border border-border rounded-xl mt-1 max-h-40 overflow-hidden">
                {(sourceQuery.data || []).slice(0, 5).map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    className="px-4 py-2.5 border-b border-border/50"
                    onPress={() => { setSourceAccount(item.name); setSourceAccountId(String(item.id)); setShowSourceSuggestions(false); }}
                  >
                    <Text className="text-sm text-foreground">{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {/* Destination Account */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">
              {type === 'withdrawal' ? 'Expense Account' : 'Destination Account'}
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Search account..."
              placeholderTextColor={colors.muted}
              value={destAccount}
              onChangeText={(text) => { setDestAccount(text); setDestAccountId(''); setShowDestSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
            />
            {showDestSuggestions && (destQuery.data || []).length > 0 ? (
              <View className="bg-surface border border-border rounded-xl mt-1 max-h-40 overflow-hidden">
                {(destQuery.data || []).slice(0, 5).map((item: any) => (
                  <TouchableOpacity
                    key={item.id}
                    className="px-4 py-2.5 border-b border-border/50"
                    onPress={() => { setDestAccount(item.name); setDestAccountId(String(item.id)); setShowDestSuggestions(false); }}
                  >
                    <Text className="text-sm text-foreground">{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>

          {/* Date */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Date</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Category</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Category name"
              placeholderTextColor={colors.muted}
              value={category}
              onChangeText={setCategory}
            />
          </View>

          {/* Budget */}
          {type === 'withdrawal' ? (
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-1">Budget</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="Budget name"
                placeholderTextColor={colors.muted}
                value={budget}
                onChangeText={setBudget}
              />
            </View>
          ) : null}

          {/* Tags */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Tags</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Comma separated tags"
              placeholderTextColor={colors.muted}
              value={tags}
              onChangeText={setTags}
            />
          </View>

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
              <TextInput
                className="w-24 bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
                placeholder="USD"
                placeholderTextColor={colors.muted}
                value={foreignCurrencyCode}
                onChangeText={setForeignCurrencyCode}
                autoCapitalize="characters"
              />
            </View>
          </View>

          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
