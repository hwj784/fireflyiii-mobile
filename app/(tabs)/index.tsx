import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
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

  const monthName = new Date().toLocaleDateString(undefined, { month: 'long' });

  const renderHeader = () => (
    <View>
      {/* Hero Balance Card */}
      <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroLabel}>Net Worth</Text>
          <Text style={styles.heroAmount}>
            {balanceEntry ? formatCurrency(balanceEntry.value_parsed || 0, balanceEntry.currency_symbol) : '...'}
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <View style={styles.heroStatIcon}>
                <MaterialIcons name="arrow-downward" size={14} color="#FF6B6B" />
              </View>
              <View>
                <Text style={styles.heroStatLabel}>Spent</Text>
                <Text style={styles.heroStatValue}>
                  {spentEntry ? formatCurrency(Math.abs(spentEntry.value_parsed || 0), spentEntry.currency_symbol) : '...'}
                </Text>
              </View>
            </View>
            <View style={styles.heroStatDivider} />
            <View style={styles.heroStatItem}>
              <View style={[styles.heroStatIcon, { backgroundColor: 'rgba(52,211,153,0.2)' }]}>
                <MaterialIcons name="arrow-upward" size={14} color="#34D399" />
              </View>
              <View>
                <Text style={styles.heroStatLabel}>Earned</Text>
                <Text style={styles.heroStatValue}>
                  {earnedEntry ? formatCurrency(earnedEntry.value_parsed || 0, earnedEntry.currency_symbol) : '...'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Stats Row */}
      <View style={styles.quickStatsRow}>
        <View style={[styles.quickStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.quickStatIconBg, { backgroundColor: colors.warning + '18' }]}>
            <MaterialIcons name="receipt-long" size={18} color={colors.warning} />
          </View>
          <Text style={[styles.quickStatLabel, { color: colors.muted }]}>Bills Due</Text>
          <Text style={[styles.quickStatValue, { color: colors.foreground }]} numberOfLines={1}>
            {billsEntry ? formatCurrency(Math.abs(billsEntry.value_parsed || 0), billsEntry.currency_symbol) : '—'}
          </Text>
        </View>
        <View style={[styles.quickStatCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.quickStatIconBg, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="account-balance" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.quickStatLabel, { color: colors.muted }]}>Accounts</Text>
          <Text style={[styles.quickStatValue, { color: colors.foreground }]}>{accounts.length}</Text>
        </View>
      </View>

      {/* Accounts Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accounts</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/accounts')} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
            <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {accountsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          accounts.slice(0, 5).map((account: any, index: number) => {
            const attr = account.attributes;
            const bal = parseFloat(attr.current_balance || '0');
            return (
              <TouchableOpacity
                key={account.id}
                style={[styles.accountRow, { borderBottomColor: colors.border }, index === Math.min(accounts.length, 5) - 1 && { borderBottomWidth: 0 }]}
                onPress={() => router.push(`/details/account/${account.id}` as any)}
                activeOpacity={0.6}
              >
                <View style={[styles.accountIcon, { backgroundColor: colors.primary + '12' }]}>
                  <MaterialIcons name="account-balance" size={18} color={colors.primary} />
                </View>
                <View style={styles.accountInfo}>
                  <Text style={[styles.accountName, { color: colors.foreground }]} numberOfLines={1}>{attr.name}</Text>
                  <Text style={[styles.accountType, { color: colors.muted }]}>{(attr.account_role || attr.type || '').replace(/([A-Z])/g, ' $1').trim()}</Text>
                </View>
                <Text style={[styles.accountBalance, { color: bal >= 0 ? colors.foreground : colors.error }]}>
                  {formatCurrency(attr.current_balance, attr.currency_symbol)}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Recent Transactions Header */}
      <View style={[styles.sectionHeader, { paddingHorizontal: 20 }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          <MaterialIcons name="chevron-right" size={16} color={colors.primary} />
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
    const iconName = isExpense ? 'arrow-downward' : isIncome ? 'arrow-upward' : 'swap-horiz';

    return (
      <TouchableOpacity
        style={[styles.txRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => router.push(`/details/transaction/${item.id}` as any)}
        activeOpacity={0.6}
      >
        <View style={[styles.txIcon, { backgroundColor: amountColor + '14' }]}>
          <MaterialIcons name={iconName} size={18} color={amountColor} />
        </View>
        <View style={styles.txInfo}>
          <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>{tx.description}</Text>
          <Text style={[styles.txMeta, { color: colors.muted }]} numberOfLines={1}>
            {tx.source_name}{tx.source_name && tx.destination_name ? ' → ' : ''}{tx.destination_name}
          </Text>
        </View>
        <View style={styles.txAmountCol}>
          <Text style={[styles.txAmount, { color: amountColor }]}>
            {sign}{formatCurrency(tx.amount, tx.currency_symbol)}
          </Text>
          <Text style={[styles.txDate, { color: colors.muted }]}>{formatDateShort(tx.date)}</Text>
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
            <Text style={{ color: colors.muted, textAlign: 'center', paddingVertical: 32 }}>No recent transactions</Text>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/modals/transaction-form')}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  heroContent: {
    padding: 24,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
  },
  heroStatItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,107,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
  },
  heroStatValue: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  quickStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  quickStatIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickStatLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountInfo: {
    flex: 1,
    marginRight: 8,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
  },
  accountType: {
    fontSize: 12,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 15,
    fontWeight: '700',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
    marginRight: 8,
  },
  txDesc: {
    fontSize: 14,
    fontWeight: '600',
  },
  txMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmountCol: {
    alignItems: 'flex-end',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  txDate: {
    fontSize: 11,
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
});
