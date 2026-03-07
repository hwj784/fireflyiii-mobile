import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RulesScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['rules'], queryFn: () => api.getRules(1) });
  const rules = query.data?.data || [];

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Rule', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteRule(id); queryClient.invalidateQueries({ queryKey: ['rules'] }); }
        catch (e: any) { Alert.alert('Error', e.message); }
      }},
    ]);
  };

  const handleFireRule = async (id: string) => {
    try {
      await api.fireRule(id);
      Alert.alert('Success', 'Rule executed successfully');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-foreground flex-1">Rules</Text>
      </View>
      <FlatList
        data={rules}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const triggers = attr.triggers || [];
          const actions = attr.actions || [];
          return (
            <View className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="rule" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground" numberOfLines={1}>{attr.title}</Text>
                    <Text className="text-xs text-muted">{attr.active ? 'Active' : 'Inactive'} · {triggers.length} trigger{triggers.length !== 1 ? 's' : ''} · {actions.length} action{actions.length !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity onPress={() => handleFireRule(item.id)} className="mr-2">
                    <MaterialIcons name="play-arrow" size={20} color={colors.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, attr.title)}>
                    <MaterialIcons name="delete" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              {triggers.length > 0 ? (
                <View className="ml-13">
                  <Text className="text-xs text-muted mb-0.5">Triggers:</Text>
                  {triggers.slice(0, 3).map((t: any, i: number) => (
                    <Text key={i} className="text-xs text-foreground">• {t.type}: {t.value}</Text>
                  ))}
                  {triggers.length > 3 ? <Text className="text-xs text-muted">+{triggers.length - 3} more</Text> : null}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text className="text-muted text-center py-8">No rules</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}
