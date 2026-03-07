import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign, getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BudgetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const start = getStartOfMonth();
  const end = getEndOfMonth();

  const budgetQuery = useQuery({ queryKey: ['budget', id], queryFn: () => api.getBudget(id!), enabled: !!id });
  const txQuery = useQuery({ queryKey: ['budget-transactions', id], queryFn: () => api.getBudgetTransactions(id!, 1, { start, end }), enabled: !!id });
  const limitsQuery = useQuery({ queryKey: ['budget-limits', start, end], queryFn: () => api.get<any>('/v1/budget-limits', { start, end }) });

  const budget = budgetQuery.data?.data;
  const transactions = txQuery.data?.data || [];
  const limits = limitsQuery.data?.data || [];
  const limit = limits.find((l: any) => l.attributes?.budget_id === id);
  const limitAmount = limit ? parseFloat(limit.attributes?.amount || '0') : 0;
  const spent = limit ? Math.abs(parseFloat(limit.attributes?.spent || '0')) : 0;
  const percentage = limitAmount > 0 ? Math.min((spent / limitAmount) * 100, 100) : 0;
  const isOverBudget = spent > limitAmount && limitAmount > 0;

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
            <View className="flex-row items-center mb-4">
              <TouchableOpacity onPress={() => router.back()} className="mr-3"><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></TouchableOpacity>
              <Text className="text-xl font-bold text-foreground flex-1">{budget?.attributes?.name || 'Budget'}</Text>
              <TouchableOpacity onPress={() => router.push(`/modals/budget-form?id=${id}` as any)}>
                <MaterialIcons name="edit" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {limitAmount > 0 ? (
              <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-muted">Spent</Text>
                  <Text className={`text-sm font-semibold ${isOverBudget ? 'text-error' : 'text-foreground'}`}>
                    {formatCurrency(spent, limit?.attributes?.currency_symbol)} / {formatCurrency(limitAmount, limit?.attributes?.currency_symbol)}
                  </Text>
                </View>
                <View className="h-3 bg-border rounded-full overflow-hidden">
                  <View className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: isOverBudget ? colors.error : percentage > 80 ? colors.warning : colors.success }} />
                </View>
                <Text className="text-xs text-muted mt-1">{percentage.toFixed(0)}% used · {formatCurrency(Math.max(limitAmount - spent, 0), limit?.attributes?.currency_symbol)} remaining</Text>
              </View>
            ) : null}
            <Text className="text-lg font-semibold text-foreground">Transactions</Text>
          </View>
        }
        ListEmptyComponent={txQuery.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> : <Text className="text-muted text-center py-8">No transactions</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={txQuery.isRefetching} onRefresh={() => { budgetQuery.refetch(); txQuery.refetch(); limitsQuery.refetch(); }} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}
