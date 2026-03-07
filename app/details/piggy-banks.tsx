import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function PiggyBanksScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['piggy-banks'], queryFn: () => api.getPiggyBanks(1) });
  const piggyBanks = query.data?.data || [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Piggy Bank', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deletePiggyBank(id); queryClient.invalidateQueries({ queryKey: ['piggy-banks'] }); }
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
        <Text className="text-2xl font-bold text-foreground flex-1">Piggy Banks</Text>
      </View>
      <FlatList
        data={piggyBanks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const current = parseFloat(attr.current_amount || '0');
          const target = parseFloat(attr.target_amount || '0');
          const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
          return (
            <TouchableOpacity className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border"
              onPress={() => router.push(`/details/piggy-bank/${item.id}` as any)}>
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="savings" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground" numberOfLines={1}>{attr.name}</Text>
                    <Text className="text-xs text-muted">{attr.account_name}</Text>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity onPress={() => router.push(`/modals/piggy-form?id=${item.id}` as any)} className="mr-2">
                    <MaterialIcons name="edit" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, attr.name)}>
                    <MaterialIcons name="delete" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-sm font-semibold text-foreground">
                  {formatCurrency(current, attr.currency_symbol)}
                </Text>
                {target > 0 ? (
                  <Text className="text-sm text-muted">of {formatCurrency(target, attr.currency_symbol)}</Text>
                ) : null}
              </View>
              {target > 0 ? (
                <View className="h-2 bg-border rounded-full overflow-hidden">
                  <View className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                </View>
              ) : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text className="text-muted text-center py-8">No piggy banks</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/piggy-form' as any)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
