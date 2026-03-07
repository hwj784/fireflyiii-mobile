import React, { useCallback } from 'react';
import { Text, View, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, StyleSheet } from 'react-native';
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
  const balance = parseFloat(attr?.current_balance || '0');

  const onRefresh = useCallback(() => { accountQuery.refetch(); txQuery.refetch(); }, []);

  const handleDelete = () => {
    Alert.alert('Delete Account', `Are you sure you want to delete "${attr?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deleteAccount(id!);
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            router.back();
          } catch (e: any) { Alert.alert('Error', e.message); }
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
          <Text style={[styles.txMeta, { color: colors.muted }]} numberOfLines={1}>
            {tx.source_name}{tx.source_name && tx.destination_name ? ' → ' : ''}{tx.destination_name}
          </Text>
        </View>
        <View style={styles.txAmountCol}>
          <Text style={[styles.txAmount, { color: amountColor }]}>{sign}{formatCurrency(tx.amount, tx.currency_symbol)}</Text>
          <Text style={[styles.txDate, { color: colors.muted }]}>{formatDate(tx.date)}</Text>
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
          <View>
            {/* Nav bar */}
            <View style={styles.navBar}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
              </TouchableOpacity>
              <View style={styles.navActions}>
                <TouchableOpacity
                  onPress={() => router.push(`/modals/account-form?id=${id}` as any)}
                  style={[styles.navBtn, { backgroundColor: colors.surface }]}
                >
                  <MaterialIcons name="edit" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={[styles.navBtn, { backgroundColor: colors.error + '12' }]}>
                  <MaterialIcons name="delete-outline" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero balance card */}
            <View style={[styles.heroCard, { backgroundColor: colors.primary }]}>
              <View style={styles.heroOverlay} />
              <View style={styles.heroContent}>
                <View style={[styles.heroIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                  <MaterialIcons name={(getAccountIcon(attr?.type, attr?.account_role) || 'account-balance') as any} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.heroName} numberOfLines={1}>{attr?.name}</Text>
                <Text style={styles.heroType}>{(attr?.type || '').replace(/-/g, ' ')}</Text>
                <Text style={styles.heroBalance}>{formatCurrency(attr?.current_balance || 0, attr?.currency_symbol)}</Text>
              </View>
            </View>

            {/* Info rows */}
            {(attr?.iban || attr?.account_number || attr?.notes) ? (
              <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {attr?.iban ? (
                  <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.infoLabel, { color: colors.muted }]}>IBAN</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{attr.iban}</Text>
                  </View>
                ) : null}
                {attr?.account_number ? (
                  <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.infoLabel, { color: colors.muted }]}>Account Number</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{attr.account_number}</Text>
                  </View>
                ) : null}
                {attr?.notes ? (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.muted }]}>Notes</Text>
                    <Text style={[styles.infoValue, { color: colors.foreground }]}>{attr.notes}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            {/* Section header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transactions</Text>
              <Text style={[styles.sectionCount, { color: colors.muted }]}>{transactions.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          txQuery.isLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="receipt-long" size={40} color={colors.border} />
              <Text style={{ color: colors.muted, fontSize: 14, marginTop: 8 }}>No transactions for this account</Text>
            </View>
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

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navActions: {
    flexDirection: 'row',
    gap: 8,
  },
  heroCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  heroContent: {
    padding: 24,
    alignItems: 'center',
  },
  heroIconBg: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  heroType: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'capitalize',
    marginBottom: 16,
  },
  heroBalance: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  infoRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  txCard: {
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
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
});
