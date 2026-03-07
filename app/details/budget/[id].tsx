import React from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign, getStartOfMonth, getEndOfMonth } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, NavActionButton, EmptyState } from '@/components/ui/styled-list-screen';

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
  const barColor = isOverBudget ? colors.error : percentage > 80 ? colors.warning : colors.success;
  const remaining = Math.max(limitAmount - spent, 0);

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

  if (budgetQuery.isLoading) {
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
            <ScreenNavBar
              title={budget?.attributes?.name || 'Budget'}
              rightActions={
                <NavActionButton icon="edit" color={colors.primary} bgColor={colors.surface} onPress={() => router.push(`/modals/budget-form?id=${id}` as any)} />
              }
            />

            {/* Hero Progress Card */}
            <View style={[styles.heroCard, { backgroundColor: barColor }]}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={[styles.heroIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <MaterialIcons name="pie-chart" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.heroName}>{budget?.attributes?.name}</Text>

                {limitAmount > 0 ? (
                  <>
                    <Text style={styles.heroSpent}>
                      {formatCurrency(spent, limit?.attributes?.currency_symbol)}
                    </Text>
                    <Text style={styles.heroLimit}>
                      of {formatCurrency(limitAmount, limit?.attributes?.currency_symbol)}
                    </Text>

                    {/* Progress bar */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                    </View>

                    <View style={styles.progressLabels}>
                      <View style={[styles.pctBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                        <Text style={styles.pctText}>{percentage.toFixed(0)}%</Text>
                      </View>
                      <Text style={styles.remainingText}>
                        {isOverBudget ? `${formatCurrency(spent - limitAmount, limit?.attributes?.currency_symbol)} over` : `${formatCurrency(remaining, limit?.attributes?.currency_symbol)} left`}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.heroLimit}>No limit set</Text>
                )}
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
          <EmptyState icon="receipt-long" title="No transactions" subtitle="No spending in this budget yet" />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={txQuery.isRefetching} onRefresh={() => { budgetQuery.refetch(); txQuery.refetch(); limitsQuery.refetch(); }} tintColor={colors.primary} />}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  heroContent: { padding: 24, alignItems: 'center' },
  heroIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroName: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroSpent: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  heroLimit: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 16 },
  progressTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  pctBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pctText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  remainingText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
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
