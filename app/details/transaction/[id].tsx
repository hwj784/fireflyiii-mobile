import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate, getTransactionSign } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();

  const txQuery = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => api.getTransaction(id!),
    enabled: !!id,
  });

  const transaction = txQuery.data?.data;
  const splits = transaction?.attributes?.transactions || [];

  const handleDelete = () => {
    Alert.alert('Delete Transaction', 'Are you sure you want to delete this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await api.deleteTransaction(id!);
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            router.back();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }
      },
    ]);
  };

  if (txQuery.isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator color={colors.primary} size="large" />
      </ScreenContainer>
    );
  }

  const firstSplit = splits[0];
  if (!firstSplit) {
    return (
      <ScreenContainer className="items-center justify-center">
        <Text style={{ color: colors.muted, fontSize: 15 }}>Transaction not found</Text>
      </ScreenContainer>
    );
  }

  const isExpense = firstSplit.type === 'withdrawal';
  const isIncome = firstSplit.type === 'deposit';
  const amountColor = isExpense ? colors.error : isIncome ? colors.success : colors.primary;
  const sign = getTransactionSign(firstSplit.type);
  const typeLabel = firstSplit.type.charAt(0).toUpperCase() + firstSplit.type.slice(1);
  const typeIcon = isExpense ? 'arrow-downward' : isIncome ? 'arrow-upward' : 'swap-horiz';

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Nav bar */}
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
            <MaterialIcons name="arrow-back" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.foreground }]}>Transaction</Text>
          <View style={styles.navActions}>
            <TouchableOpacity
              onPress={() => router.push(`/modals/transaction-form?id=${id}` as any)}
              style={[styles.navBtn, { backgroundColor: colors.surface }]}
            >
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={[styles.navBtn, { backgroundColor: colors.error + '12' }]}>
              <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Amount Card */}
        <View style={[styles.heroCard, { backgroundColor: amountColor }]}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.typeBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialIcons name={typeIcon as any} size={16} color="#FFFFFF" />
              <Text style={styles.typeText}>{typeLabel}</Text>
            </View>
            <Text style={styles.heroAmount}>{sign}{formatCurrency(firstSplit.amount, firstSplit.currency_symbol)}</Text>
            <Text style={styles.heroDesc} numberOfLines={2}>{firstSplit.description}</Text>
            <Text style={styles.heroDate}>{formatDate(firstSplit.date)}</Text>
          </View>
        </View>

        {/* Flow: Source → Destination */}
        <View style={[styles.flowCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.flowItem}>
            <View style={[styles.flowDot, { backgroundColor: colors.success }]} />
            <View style={styles.flowInfo}>
              <Text style={[styles.flowLabel, { color: colors.muted }]}>From</Text>
              <Text style={[styles.flowValue, { color: colors.foreground }]}>{firstSplit.source_name || '—'}</Text>
            </View>
          </View>
          <View style={[styles.flowLine, { borderLeftColor: colors.border }]} />
          <View style={styles.flowItem}>
            <View style={[styles.flowDot, { backgroundColor: colors.error }]} />
            <View style={styles.flowInfo}>
              <Text style={[styles.flowLabel, { color: colors.muted }]}>To</Text>
              <Text style={[styles.flowValue, { color: colors.foreground }]}>{firstSplit.destination_name || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Detail Splits */}
        {splits.map((split: any, index: number) => (
          <View key={index} style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {splits.length > 1 ? (
              <View style={[styles.splitHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.splitTitle, { color: colors.foreground }]}>Split {index + 1}</Text>
                <Text style={[styles.splitAmount, { color: amountColor }]}>
                  {sign}{formatCurrency(split.amount, split.currency_symbol)}
                </Text>
              </View>
            ) : null}

            {split.category_name ? <DetailRow icon="category" label="Category" value={split.category_name} colors={colors} /> : null}
            {split.budget_name ? <DetailRow icon="pie-chart" label="Budget" value={split.budget_name} colors={colors} /> : null}
            {split.bill_name ? <DetailRow icon="receipt-long" label="Bill" value={split.bill_name} colors={colors} /> : null}
            {split.tags?.length > 0 ? <DetailRow icon="local-offer" label="Tags" value={split.tags.join(', ')} colors={colors} /> : null}
            {split.notes ? <DetailRow icon="notes" label="Notes" value={split.notes} colors={colors} /> : null}
            {split.foreign_amount ? (
              <DetailRow icon="currency-exchange" label="Foreign Amount" value={formatCurrency(split.foreign_amount, split.foreign_currency_symbol)} colors={colors} />
            ) : null}
            {split.external_id ? <DetailRow icon="fingerprint" label="External ID" value={split.external_id} colors={colors} /> : null}
            {split.internal_reference ? <DetailRow icon="bookmark" label="Reference" value={split.internal_reference} colors={colors} /> : null}

            {/* Show "no extra details" if nothing is present */}
            {!split.category_name && !split.budget_name && !split.bill_name && !(split.tags?.length > 0) && !split.notes && !split.foreign_amount ? (
              <View style={styles.noDetails}>
                <Text style={{ color: colors.muted, fontSize: 13 }}>No additional details</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

function DetailRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  if (!value) return null;
  return (
    <View style={[detailStyles.row, { borderBottomColor: colors.border }]}>
      <MaterialIcons name={icon as any} size={16} color={colors.muted} style={{ marginRight: 10, marginTop: 1 }} />
      <View style={detailStyles.rowContent}>
        <Text style={[detailStyles.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[detailStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
  },
  rowContent: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
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
  navTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
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
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginBottom: 16,
  },
  typeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroDate: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  flowCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  flowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  flowInfo: {
    flex: 1,
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  flowValue: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 1,
  },
  flowLine: {
    height: 20,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    marginLeft: 4,
    marginVertical: 4,
  },
  detailCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  splitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  splitAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  noDetails: {
    padding: 16,
    alignItems: 'center',
  },
});
