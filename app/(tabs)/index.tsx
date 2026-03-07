import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import { formatCurrency, formatDateShort, getStartOfMonth, getEndOfMonth, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const start = getStartOfMonth();
  const end = getEndOfMonth();

  const summaryQuery = useQuery({
    queryKey: ['summary', start, end],
    queryFn: () => api.getSummary(start, end),
    enabled: isAuthenticated,
  });

  const accountsQuery = useQuery({
    queryKey: ['accounts', 'asset'],
    queryFn: () => api.getAccounts(1, 'asset'),
    enabled: isAuthenticated,
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: () => api.getTransactions(1, { limit: '10', type: 'all' }),
    enabled: isAuthenticated,
  });

  const budgetsQuery = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.getBudgets(1),
    enabled: isAuthenticated,
  });

  const isRefreshing = summaryQuery.isRefetching || accountsQuery.isRefetching;

  const onRefresh = useCallback(() => {
    summaryQuery.refetch();
    accountsQuery.refetch();
    transactionsQuery.refetch();
    budgetsQuery.refetch();
  }, []);

  const summary = summaryQuery.data || {};
  const accounts = accountsQuery.data?.data || [];
  const transactions = transactionsQuery.data?.data || [];

  // Parse summary values
  const getSummaryValue = (key: string) => {
    const entries = Object.entries(summary);
    for (const [k, v] of entries) {
      if (k.startsWith(key)) return v as any;
    }
    return null;
  };

  const balanceEntry = getSummaryValue('balance-in-');
  const spentEntry = getSummaryValue('spent-in-budgets-');
  const earnedEntry = getSummaryValue('earned-in-');
  const billsEntry = getSummaryValue('bills-unpaid-');

  const renderHeader = () => (
    <View className="px-4 pt-2 pb-2">
      <Text className="text-2xl font-bold text-foreground mb-4">Dashboard</Text>

      {/* Summary Cards */}
      <View className="flex-row flex-wrap gap-3 mb-5">
        <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Net Worth</Text>
          <Text className="text-xl font-bold text-foreground" numberOfLines={1}>
            {balanceEntry ? formatCurrency(balanceEntry.value_parsed || 0, balanceEntry.currency_symbol) : '...'}
          </Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Spent this month</Text>
          <Text className="text-xl font-bold text-error" numberOfLines={1}>
            {spentEntry ? formatCurrency(Math.abs(spentEntry.value_parsed || 0), spentEntry.currency_symbol) : '...'}
          </Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Earned this month</Text>
          <Text className="text-xl font-bold text-success" numberOfLines={1}>
            {earnedEntry ? formatCurrency(earnedEntry.value_parsed || 0, earnedEntry.currency_symbol) : '...'}
          </Text>
        </View>
        <View className="flex-1 min-w-[45%] bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-xs text-muted mb-1">Bills unpaid</Text>
          <Text className="text-xl font-bold text-warning" numberOfLines={1}>
            {billsEntry ? formatCurrency(Math.abs(billsEntry.value_parsed || 0), billsEntry.currency_symbol) : '...'}
          </Text>
        </View>
      </View>

      {/* Asset Accounts */}
      <View className="mb-5">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-semibold text-foreground">Accounts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')}>
            <Text className="text-sm text-primary">See All</Text>
          </TouchableOpacity>
        </View>
        {accountsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          accounts.slice(0, 5).map((account: any) => {
            const attr = account.attributes;
            return (
              <TouchableOpacity
                key={account.id}
                className="bg-surface rounded-xl p-3.5 mb-2 border border-border flex-row items-center justify-between"
                onPress={() => router.push(`/details/account/${account.id}` as any)}
                activeOpacity={0.7}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-base font-medium text-foreground" numberOfLines={1}>{attr.name}</Text>
                  <Text className="text-xs text-muted">{attr.type?.replace(/-/g, ' ')}</Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {formatCurrency(attr.current_balance, attr.currency_symbol)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Recent Transactions */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-lg font-semibold text-foreground">Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
          <Text className="text-sm text-primary">See All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransaction = ({ item }: { item: any }) => {
    const tx = item.attributes?.transactions?.[0];
    if (!tx) return null;
    const isExpense = tx.type === 'withdrawal';
    const isIncome = tx.type === 'deposit';
    const amountColor = isExpense ? colors.error : isIncome ? colors.success : colors.primary;
    const sign = getTransactionSign(tx.type);

    return (
      <TouchableOpacity
        className="bg-surface rounded-xl p-3.5 mx-4 mb-2 border border-border flex-row items-center"
        onPress={() => router.push(`/details/transaction/${item.id}` as any)}
        activeOpacity={0.7}
      >
        <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: amountColor + '18' }}>
          <MaterialIcons
            name={isExpense ? 'arrow-downward' : isIncome ? 'arrow-upward' : 'swap-horiz'}
            size={18}
            color={amountColor}
          />
        </View>
        <View className="flex-1 mr-2">
          <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{tx.description}</Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {tx.source_name || ''}{tx.source_name && tx.destination_name ? ' → ' : ''}{tx.destination_name || ''}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-sm font-semibold" style={{ color: amountColor }}>
            {sign}{formatCurrency(tx.amount, tx.currency_symbol)}
          </Text>
          <Text className="text-xs text-muted">{formatDateShort(tx.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color={colors.primary} size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          transactionsQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <Text className="text-muted text-center py-8 px-4">No recent transactions</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      {/* FAB - New Transaction */}
      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/transaction-form')}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
