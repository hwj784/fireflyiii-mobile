import React, { useState, useEffect } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
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

  const tagQuery = useQuery({ queryKey: ['tag', editTag], queryFn: () => api.getTag(editTag!), enabled: isEditing });

  useEffect(() => {
    if (tagQuery.data?.data) {
      const attr = tagQuery.data.data.attributes;
      setTag(attr.tag || ''); setDescription(attr.description || '');
    }
  }, [tagQuery.data]);

  const handleSave = async () => {
    if (!tag.trim()) { Alert.alert('Error', 'Please enter a tag name'); return; }
    setSaving(true);
    try {
      const data = { tag: tag.trim(), description: description || undefined };
      if (isEditing) { await api.updateTag(editTag!, data); } else { await api.createTag(data); }
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      router.back();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save'); } finally { setSaving(false); }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="close" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>{isEditing ? 'Edit Tag' : 'New Tag'}</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 80 }} keyboardShouldPersistTaps="handled">
          <View style={[styles.formSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.formField, { borderBottomColor: colors.border }]}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="local-offer" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground }]} placeholder="Tag Name *" placeholderTextColor={colors.muted} value={tag} onChangeText={setTag} />
              </View>
            </View>
            <View style={styles.formField}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="notes" size={18} color={colors.muted} style={styles.fieldIcon} />
                <TextInput style={[styles.fieldInput, { color: colors.foreground, minHeight: 50 }]} placeholder="Description (optional)" placeholderTextColor={colors.muted} value={description} onChangeText={setDescription} multiline textAlignVertical="top" />
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', marginLeft: 12, letterSpacing: -0.3 },
  saveBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  formSection: { borderRadius: 16, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  formField: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
});
