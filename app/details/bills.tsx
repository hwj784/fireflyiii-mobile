import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BillsScreen() {
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const query = useQuery({ queryKey: ['bills'], queryFn: () => api.getBills(1) });
  const bills = query.data?.data || [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Bill', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.deleteBill(id); queryClient.invalidateQueries({ queryKey: ['bills'] }); }
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
        <Text className="text-2xl font-bold text-foreground flex-1">Bills</Text>
      </View>
      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const attr = item.attributes;
          const isPaid = attr.paid_dates && attr.paid_dates.length > 0;
          return (
            <TouchableOpacity className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border"
              onPress={() => router.push(`/details/bill/${item.id}` as any)}>
              <View className="flex-row items-center justify-between mb-1">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: (isPaid ? colors.success : colors.warning) + '18' }}>
                    <MaterialIcons name={isPaid ? 'check-circle' : 'schedule'} size={20} color={isPaid ? colors.success : colors.warning} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-medium text-foreground" numberOfLines={1}>{attr.name}</Text>
                    <Text className="text-xs text-muted capitalize">{attr.repeat_freq}</Text>
                  </View>
                </View>
                <View className="flex-row">
                  <TouchableOpacity onPress={() => router.push(`/modals/bill-form?id=${item.id}` as any)} className="mr-2">
                    <MaterialIcons name="edit" size={18} color={colors.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item.id, attr.name)}>
                    <MaterialIcons name="delete" size={18} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
              <Text className="text-sm text-foreground ml-13">
                {formatCurrency(attr.amount_min, attr.currency_symbol)} – {formatCurrency(attr.amount_max, attr.currency_symbol)}
              </Text>
              {attr.next_expected_match ? (
                <Text className="text-xs text-muted ml-13 mt-0.5">Next: {formatDate(attr.next_expected_match)}</Text>
              ) : null}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={query.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : <Text className="text-muted text-center py-8">No bills</Text>}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} tintColor={colors.primary} />}
      />
      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/bill-form' as any)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
