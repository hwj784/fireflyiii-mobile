import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function CategoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();

  const catQuery = useQuery({ queryKey: ['category', id], queryFn: () => api.getCategory(id!), enabled: !!id });
  const txQuery = useQuery({ queryKey: ['category-transactions', id], queryFn: () => api.getCategoryTransactions(id!, 1), enabled: !!id });

  const category = catQuery.data?.data;
  const transactions = txQuery.data?.data || [];

  const renderTransaction = ({ item }: { item: any }) => {
    const tx = item.attributes?.transactions?.[0];
    if (!tx) return null;
    const isExpense = tx.type === 'withdrawal';
    const isIncome = tx.type === 'deposit';
    const amountColor = isExpense ? colors.error : isIncome ? colors.success : colors.primary;
    return (
      <TouchableOpacity className="bg-surface rounded-xl p-3.5 mx-4 mb-2 border border-border flex-row items-center" onPress={() => router.push(`/details/transaction/${item.id}` as any)}>
        <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: amountColor + '18' }}>
          <MaterialIcons name={isExpense ? 'arrow-downward' : isIncome ? 'arrow-upward' : 'swap-horiz'} size={18} color={amountColor} />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{tx.description}</Text>
          <Text className="text-xs text-muted">{tx.source_name} → {tx.destination_name}</Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-semibold" style={{ color: amountColor }}>{getTransactionSign(tx.type)}{formatCurrency(tx.amount, tx.currency_symbol)}</Text>
          <Text className="text-xs text-muted">{formatDate(tx.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <View className="px-4 pt-2 pb-3">
            <View className="flex-row items-center mb-2">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-foreground">{category?.attributes?.name || 'Category'}</Text>
            </View>
            {category?.attributes?.notes ? <Text className="text-sm text-muted mb-2">{category.attributes.notes}</Text> : null}
            <Text className="text-lg font-semibold text-foreground mt-2">Transactions</Text>
          </View>
        }
        ListEmptyComponent={txQuery.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : <Text className="text-muted text-center py-8">No transactions</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={txQuery.isRefetching} onRefresh={() => { catQuery.refetch(); txQuery.refetch(); }} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}
