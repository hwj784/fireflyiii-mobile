import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState, FloatingActionButton } from '@/components/ui/styled-list-screen';

export default function TagsScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['tags'], queryFn: () => api.getTags(1) });
  const tags = query.data?.data || [];

  const handleDelete = (tag: string) => {
    Alert.alert('Delete Tag', `Delete "${tag}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteTag(tag); queryClient.invalidateQueries({ queryKey: ['tags'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <ScreenContainer>
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Tags" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/details/tag/${encodeURIComponent(attr.tag)}` as any)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconBg, { backgroundColor: '#EC4899' + '14' }]}>
                <MaterialIcons name="local-offer" size={20} color="#EC4899" />
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.foreground }]}>{attr.tag}</Text>
                {attr.description ? <Text style={[styles.desc, { color: colors.muted }]} numberOfLines={1}>{attr.description}</Text> : null}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => router.push(`/modals/tag-form?tag=${encodeURIComponent(attr.tag)}` as any)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="edit" size={18} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(attr.tag)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="local-offer" title="No tags" subtitle="Tap + to create one" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <FloatingActionButton onPress={() => router.push('/modals/tag-form' as any)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 16, borderWidth: 1 },
  iconBg: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: '600' },
  desc: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { padding: 4 },
});
