import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TagFormScreen() {
  const { tag: editTag } = useLocalSearchParams<{ tag?: string }>();
  const router = useRouter();
  const colors = useColors();
  const queryClient = useQueryClient();
  const isEditing = !!editTag;

  const [tag, setTag] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const tagQuery = useQuery({
    queryKey: ['tag', editTag],
    queryFn: () => api.getTag(editTag!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (tagQuery.data?.data) {
      const attr = tagQuery.data.data.attributes;
      setTag(attr.tag || '');
      setDescription(attr.description || '');
    }
  }, [tagQuery.data]);

  const handleSave = async () => {
    if (!tag.trim()) { Alert.alert('Error', 'Please enter a tag name'); return; }
    setSaving(true);
    try {
      const data = { tag: tag.trim(), description: description || undefined };
      if (isEditing) { await api.updateTag(editTag!, data); }
      else { await api.createTag(data); }
      queryClient.invalidateQueries({ queryKey: ['tags'] });
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
          <Text className="text-lg font-semibold text-foreground flex-1">{isEditing ? 'Edit Tag' : 'New Tag'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primary} /> : <Text className="text-base font-semibold text-primary">Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
          <View className="mt-4 mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Tag Name *</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="e.g. vacation" placeholderTextColor={colors.muted} value={tag} onChangeText={setTag} />
          </View>
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1">Description</Text>
            <TextInput className="bg-surface border border-border rounded-xl px-4 py-3 text-base text-foreground" placeholder="Optional description..." placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline numberOfLines={3} textAlignVertical="top" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
