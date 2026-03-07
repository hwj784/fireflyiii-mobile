import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const REPEAT_FREQS = ['weekly', 'monthly', 'quarterly', 'half-year', 'yearly'];

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
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const billQuery = useQuery({
    queryKey: ['bill', id],
    queryFn: () => api.getBill(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (billQuery.data?.data) {
      const attr = billQuery.data.data.attributes;
      setName(attr.name || '');
      setAmountMin(attr.amount_min || '');
      setAmountMax(attr.amount_max || '');
      setDate(attr.date?.split('T')[0] || '');
      setRepeatFreq(attr.repeat_freq || 'monthly');
      setNotes(attr.notes || '');
    }
  }, [billQuery.data]);

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
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Bill Name *</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="e.g. Netflix" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
          </View>
          <View className="flex-row gap-2 mb-4">
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground mb-1">Min Amount *</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="0.00" placeholderTextColor={colors.muted} value={amountMin} onChangeText={setAmountMin} keyboardType="decimal-pad" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground mb-1">Max Amount *</Text>
              <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="0.00" placeholderTextColor={colors.muted} value={amountMax} onChangeText={setAmountMax} keyboardType="decimal-pad" />
            </View>
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Start Date</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="YYYY-MM-DD" placeholderTextColor={colors.muted} value={date} onChangeText={setDate} />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Frequency</Text>
            <View className="flex-row flex-wrap gap-2">
              {REPEAT_FREQS.map((f) => (
                <TouchableOpacity key={f} className={`px-3 py-2 rounded-xl border ${repeatFreq === f ? 'bg-primary/10 border-primary' : 'border-border'}`} onPress={() => setRepeatFreq(f)}>
                  <Text className={`text-xs capitalize ${repeatFreq === f ? 'text-primary font-medium' : 'text-muted'}`}>{f}</Text>
                </TouchableOpacity>
              ))}
            </View>
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
