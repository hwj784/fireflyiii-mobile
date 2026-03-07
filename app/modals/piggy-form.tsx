import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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

  const piggyQuery = useQuery({
    queryKey: ['piggy-bank', id],
    queryFn: () => api.getPiggyBank(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (piggyQuery.data?.data) {
      const attr = piggyQuery.data.data.attributes;
      setName(attr.name || '');
      setAccountId(String(attr.account_id || ''));
      setAccountName(attr.account_name || '');
      setTargetAmount(attr.target_amount || '');
      setNotes(attr.notes || '');
      setTargetDate(attr.target_date || '');
    }
  }, [piggyQuery.data]);

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

  const [showAccountSuggestions, setShowAccountSuggestions] = useState(false);
  const accountsQuery = useQuery({
    queryKey: ['autocomplete', 'accounts-piggy', accountName],
    queryFn: () => api.autocomplete('accounts', accountName, { types: 'Asset account' }),
    enabled: accountName.length > 0 && showAccountSuggestions,
  });

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
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Name *</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="e.g. Vacation Fund" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Linked Account *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground"
              placeholder="Search asset account..."
              placeholderTextColor={colors.muted}
              value={accountName}
              onChangeText={(text) => { setAccountName(text); setAccountId(''); setShowAccountSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowAccountSuggestions(false), 200)}
            />
            {showAccountSuggestions && (accountsQuery.data || []).length > 0 ? (
              <View className="bg-surface border border-border rounded-xl mt-1">
                {(accountsQuery.data || []).slice(0, 5).map((item: any) => (
                  <TouchableOpacity key={item.id} className="px-4 py-2.5 border-b border-border/50"
                    onPress={() => { setAccountName(item.name); setAccountId(String(item.id)); setShowAccountSuggestions(false); }}>
                    <Text className="text-sm text-foreground">{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Target Amount</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="0.00" placeholderTextColor={colors.muted} value={targetAmount} onChangeText={setTargetAmount} keyboardType="decimal-pad" />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Target Date</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} value={targetDate} onChangeText={setTargetDate} />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Notes</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="Optional notes..." placeholderTextColor={colors.muted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
          <View className="h-20" />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
