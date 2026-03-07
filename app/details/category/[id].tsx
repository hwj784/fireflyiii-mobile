import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, EmptyState } from '@/components/ui/styled-list-screen';

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
    const iconName = isExpense ? 'arrow-downward' : isIncome ? 'arrow-upward' : 'swap-horiz';

    return (
      <TouchableOpacity
        style={[styles.txCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/details/transaction/${item.id}` as any)}
        activeOpacity={0.6}
      >
        <View style={[styles.txIcon, { backgroundColor: amountColor + '14' }]}>
          <MaterialIcons name={iconName as any} size={18} color={amountColor} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>{tx.description}</Text>
          <Text style={[styles.txMeta, { color: colors.muted }]} numberOfLines={1}>{tx.source_name} → {tx.destination_name}</Text>
        </View>
        <View style={styles.txAmountCol}>
          <Text style={[styles.txAmount, { color: amountColor }]}>{getTransactionSign(tx.type)}{formatCurrency(tx.amount, tx.currency_symbol)}</Text>
          <Text style={[styles.txDate, { color: colors.muted }]}>{formatDate(tx.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (catQuery.isLoading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={
          <View>
            <ScreenNavBar title={category?.attributes?.name || 'Category'} />
            {/* Hero */}
            <View style={[styles.heroCard, { backgroundColor: '#8B5CF6' }]}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={[styles.heroIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <MaterialIcons name="category" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.heroName}>{category?.attributes?.name}</Text>
                {category?.attributes?.notes ? <Text style={styles.heroNotes}>{category.attributes.notes}</Text> : null}
              </View>
            </View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transactions</Text>
              <Text style={[styles.sectionCount, { color: colors.muted }]}>{transactions.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          txQuery.isLoading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} /> :
          <EmptyState icon="receipt-long" title="No transactions" subtitle="No transactions in this category" />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={txQuery.isRefetching} onRefresh={() => { catQuery.refetch(); txQuery.refetch(); }} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  heroContent: { padding: 24, alignItems: 'center' },
  heroIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroName: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  heroNotes: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '500' },
  txCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 16, borderWidth: 1 },
  txIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  txInfo: { flex: 1, marginRight: 8 },
  txDesc: { fontSize: 14, fontWeight: '600' },
  txMeta: { fontSize: 12, marginTop: 2 },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700' },
  txDate: { fontSize: 11, marginTop: 2 },
});
