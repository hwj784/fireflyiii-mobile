import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function RecurringScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['recurring'], queryFn: () => api.getRecurringTransactions(1) });
  const recurring = query.data?.data || [];

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Recurring', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteRecurringTransaction(id); queryClient.invalidateQueries({ queryKey: ['recurring'] }); }
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
        <Text className="text-2xl font-bold text-foreground flex-1">Recurring</Text>
      </View>
      <FlatList
        data={recurring}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const tx = attr.transactions?.[0];
          return (
            <View className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border">
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                    <MaterialIcons name="event-repeat" size={20} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground" numberOfLines={1}>{attr.title}</Text>
                    <Text className="text-xs text-muted capitalize">{attr.repeat_freq} · {attr.active ? 'Active' : 'Inactive'}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, attr.title)}>
                  <MaterialIcons name="delete" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>
              {tx ? (
                <View className="ml-13">
                  <Text className="text-sm text-foreground">{tx.description}</Text>
                  <Text className="text-xs text-muted">{formatCurrency(tx.amount, tx.currency_symbol)} · {tx.source_name} → {tx.destination_name}</Text>
                </View>
              ) : null}
              {attr.first_date ? <Text className="text-xs text-muted ml-13 mt-1">First: {formatDate(attr.first_date)}</Text> : null}
              {attr.latest_date ? <Text className="text-xs text-muted ml-13">Latest: {formatDate(attr.latest_date)}</Text> : null}
            </View>
          );
        }}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text className="text-muted text-center py-8">No recurring transactions</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}
