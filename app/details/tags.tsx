import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground flex-1">Tags</Text>
      </View>
      <FlatList
        data={tags}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attr = item.attributes;
          return (
            <TouchableOpacity className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border flex-row items-center"
              onPress={() => router.push(`/details/tag/${encodeURIComponent(attr.tag)}` as any)}>
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <MaterialIcons name="local-offer" size={20} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">{attr.tag}</Text>
                {attr.description ? <Text className="text-xs text-muted" numberOfLines={1}>{attr.description}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => router.push(`/modals/tag-form?tag=${encodeURIComponent(attr.tag)}` as any)} className="mr-2">
                <MaterialIcons name="edit" size={18} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(attr.tag)}>
                <MaterialIcons name="delete" size={18} color={colors.error} />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text className="text-muted text-center py-8">No tags</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/tag-form' as any)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
