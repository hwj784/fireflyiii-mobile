import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CategoryFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const catQuery = useQuery({
    queryKey: ['category', id],
    queryFn: () => api.getCategory(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (catQuery.data?.data) {
      const attr = catQuery.data.data.attributes;
      setName(attr.name || '');
      setNotes(attr.notes || '');
    }
  }, [catQuery.data]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter a category name'); return; }
    setSaving(true);
    try {
      const data = { name: name.trim(), notes: notes || undefined };
      if (isEditing) { await api.updateCategory(id!, data); }
      else { await api.createCategory(data); }
      queryClient.invalidateQueries({ queryKey: ['categories'] });
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
          <Text className="text-lg font-semibold text-foreground flex-1">{isEditing ? 'Edit Category' : 'New Category'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primary} /> : <Text className="text-base font-semibold text-primary">Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Category Name *</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="e.g. Groceries" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Notes</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="Optional notes..." placeholderTextColor={colors.muted} value={notes} onChangeText={setNotes} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
