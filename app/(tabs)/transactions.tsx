import React, { useState, useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const TX_TYPES = ['all', 'withdrawal', 'deposit', 'transfer'];

export default function TransactionsScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  const txQuery = useQuery({
    queryKey: ['transactions', activeType, page],
    queryFn: () => api.getTransactions(page, { type: activeType }),
  });

  const searchTxQuery = useQuery({
    queryKey: ['search-transactions', searchQuery],
    queryFn: () => api.searchTransactions(searchQuery),
    enabled: searchQuery.length > 2,
  });

  const transactions = searchQuery.length > 2
    ? (searchTxQuery.data?.data || [])
    : (txQuery.data?.data || []);

  const totalPages = txQuery.data?.meta?.pagination?.total_pages || 1;

  const onRefresh = useCallback(() => {
    setPage(1);
    txQuery.refetch();
  }, []);

  const renderTransaction = ({ item }: { item: any }) => {
    const tx = item.attributes?.transactions?.[0];
    if (!tx) return null;
    const isExpense = tx.type === 'withdrawal';
    const isIncome = tx.type === 'deposit';
    const isTransfer = tx.type === 'transfer';
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
            {tx.source_name}{tx.source_name && tx.destination_name ? ' → ' : ''}{tx.destination_name}
          </Text>
          {tx.category_name ? (
            <Text className="text-xs text-muted">{tx.category_name}</Text>
          ) : null}
        </View>
        <View className="items-end">
          <Text className="text-sm font-semibold" style={{ color: amountColor }}>
            {sign}{formatCurrency(tx.amount, tx.currency_symbol)}
          </Text>
          <Text className="text-xs text-muted">{formatDate(tx.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScreenContainer>
      <View className="px-4 pt-2 pb-2">
        <Text className="text-2xl font-bold text-foreground mb-3">Transactions</Text>

        {/* Search */}
        <View className="flex-row items-center bg-surface border border-border rounded-xl px-3 py-2.5 mb-3">
          <MaterialIcons name="search" size={20} color={colors.muted} />
          <TextInput
            className="flex-1 ml-2 text-sm text-foreground"
            placeholder="Search transactions..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Type Filter */}
        <View className="flex-row gap-2 mb-1">
          {TX_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              className={`px-3 py-1.5 rounded-full ${activeType === type ? 'bg-primary' : 'bg-surface border border-border'}`}
              onPress={() => { setActiveType(type); setPage(1); }}
            >
              <Text className={`text-xs font-medium capitalize ${activeType === type ? 'text-white' : 'text-muted'}`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListEmptyComponent={
          txQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
          ) : (
            <Text className="text-muted text-center py-8">No transactions found</Text>
          )
        }
        ListFooterComponent={
          totalPages > 1 && !searchQuery ? (
            <View className="flex-row items-center justify-center gap-4 py-4">
              <TouchableOpacity
                onPress={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                style={page <= 1 ? { opacity: 0.3 } : undefined}
              >
                <MaterialIcons name="chevron-left" size={28} color={colors.primary} />
              </TouchableOpacity>
              <Text className="text-sm text-muted">{page} / {totalPages}</Text>
              <TouchableOpacity
                onPress={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                style={page >= totalPages ? { opacity: 0.3 } : undefined}
              >
                <MaterialIcons name="chevron-right" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={txQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      <TouchableOpacity
        className="absolute bottom-24 right-5 w-14 h-14 rounded-full bg-primary items-center justify-center"
        style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 }}
        onPress={() => router.push('/modals/transaction-form' as any)}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}
