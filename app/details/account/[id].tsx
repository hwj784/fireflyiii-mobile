import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign, getAccountIcon } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const accountQuery = useQuery({
    queryKey: ['account', id],
    queryFn: () => api.getAccount(id!),
    enabled: !!id,
  });

  const txQuery = useQuery({
    queryKey: ['account-transactions', id],
    queryFn: () => api.getAccountTransactions(id!, 1),
    enabled: !!id,
  });

  const account = accountQuery.data?.data;
  const attr = account?.attributes;
  const transactions = txQuery.data?.data || [];

  const onRefresh = useCallback(() => {
    accountQuery.refetch();
    txQuery.refetch();
  }, []);

  const handleDelete = () => {
    Alert.alert('Delete Account', `Are you sure you want to delete "${attr?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deleteAccount(id!);
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            router.back();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        }
      },
    ]);
  };

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

  if (accountQuery.isLoading) {
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
        ListHeaderComponent={
          <View className="px-4 pt-2 pb-3">
            {/* Header */}
            <View className="flex-row items-center mb-4">
              <TouchableOpacity onPress={() => router.back()} className="mr-3">
                <MaterialIcons name="arrow-back" size={24} color={colors.foreground} />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-xl font-bold text-foreground" numberOfLines={1}>{attr?.name}</Text>
                <Text className="text-sm text-muted">{(attr?.type || '').replace(/-/g, ' ')}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push(`/modals/account-form?id=${id}` as any)} className="mr-2">
                <MaterialIcons name="edit" size={22} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <MaterialIcons name="delete" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>

            {/* Balance Card */}
            <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
              <Text className="text-sm text-muted mb-1">Current Balance</Text>
              <Text className="text-3xl font-bold text-foreground">
                {formatCurrency(attr?.current_balance || 0, attr?.currency_symbol)}
              </Text>
              {attr?.iban ? <Text className="text-xs text-muted mt-2">IBAN: {attr.iban}</Text> : null}
              {attr?.account_number ? <Text className="text-xs text-muted mt-1">Account: {attr.account_number}</Text> : null}
              {attr?.notes ? <Text className="text-sm text-muted mt-2">{attr.notes}</Text> : null}
            </View>

            <Text className="text-lg font-semibold text-foreground mb-2">Transactions</Text>
          </View>
        }
        ListEmptyComponent={
          txQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <Text className="text-muted text-center py-8">No transactions for this account</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={accountQuery.isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />
    </ScreenContainer>
  );
}
