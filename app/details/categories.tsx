import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState, FloatingActionButton, NavActionButton } from '@/components/ui/styled-list-screen';

export default function CategoriesScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['categories'], queryFn: () => api.getCategories(1) });
  const categories = query.data?.data || [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteCategory(id); queryClient.invalidateQueries({ queryKey: ['categories'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  return (
    <ScreenContainer>
      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<ScreenNavBar title="Categories" />}
        renderItem={({ item }) => {
          const attr = item.attributes;
          return (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push(`/details/category/${item.id}` as any)}
              activeOpacity={0.6}
            >
              <View style={[styles.iconBg, { backgroundColor: '#8B5CF6' + '14' }]}>
                <MaterialIcons name="category" size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{attr.name}</Text>
              <View style={styles.actions}>
                <TouchableOpacity onPress={() => router.push(`/modals/category-form?id=${item.id}` as any)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="edit" size={18} color={colors.muted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(item.id, attr.name)} style={styles.actionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialIcons name="delete-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> :
          <EmptyState icon="category" title="No categories" subtitle="Tap + to create one" />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <FloatingActionButton onPress={() => router.push('/modals/category-form' as any)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    padding: 4,
  },
});
