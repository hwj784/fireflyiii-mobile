import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function BudgetsScreen() {
  const colors = useColors();
  const router = useRouter();
  const start = getStartOfMonth();
  const end = getEndOfMonth();

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.getBudgets(1),
  });

  const limitsQuery = useQuery({
    queryKey: ['budget-limits', start, end],
    queryFn: () => api.get<any>('/v1/budget-limits', { start, end }),
  });

  const budgets = budgetsQuery.data?.data || [];
  const limits = limitsQuery.data?.data || [];

  const onRefresh = useCallback(() => {
    budgetsQuery.refetch();
    limitsQuery.refetch();
  }, []);

  const getBudgetLimit = (budgetId: string) => {
    return limits.find((l: any) => l.attributes?.budget_id === budgetId);
  };

  const renderBudget = ({ item }: { item: any }) => {
    const attr = item.attributes;
    const limit = getBudgetLimit(item.id);
    const limitAmount = limit ? parseFloat(limit.attributes?.amount || '0') : 0;
    const spent = limit ? Math.abs(parseFloat(limit.attributes?.spent || '0')) : 0;
    const percentage = limitAmount > 0 ? Math.min((spent / limitAmount) * 100, 100) : 0;
    const isOverBudget = spent > limitAmount && limitAmount > 0;
    const currencySymbol = limit?.attributes?.currency_symbol || attr.currency_symbol || '';

    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-4 mx-4 mb-2 border border-border"
        onPress={() => router.push(`/details/budget/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-medium text-foreground flex-1 mr-2" numberOfLines={1}>{attr.name}</Text>
          {limitAmount > 0 ? (
            <Text className={`text-sm font-semibold ${isOverBudget ? 'text-error' : 'text-foreground'}`}>
              {formatCurrency(spent, currencySymbol)} / {formatCurrency(limitAmount, currencySymbol)}
            </Text>
          ) : (
            <Text className="text-sm text-muted">No limit</Text>
          )}
        </View>
        {limitAmount > 0 ? (
          <View>
            <View className="h-2 bg-border rounded-full overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: isOverBudget ? colors.error : percentage > 80 ? colors.warning : colors.success,
                }}
              />
            </View>
            <Text className="text-xs text-muted mt-1">
              {percentage.toFixed(0)}% used · {formatCurrency(Math.max(limitAmount - spent, 0), currencySymbol)} remaining
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-3">
        <Text className="text-2xl font-bold text-foreground">Budgets</Text>
        <Text className="text-sm text-muted mt-1">
          {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderBudget}
        ListEmptyComponent={
          budgetsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text className="text-muted text-center py-8">No budgets set up</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={budgetsQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/budget-form' as any)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
