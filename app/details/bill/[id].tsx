import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, NavActionButton } from '@/components/ui/styled-list-screen';

export default function BillDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();

  const billQuery = useQuery({ queryKey: ['bill', id], queryFn: () => api.getBill(id!), enabled: !!id });
  const bill = billQuery.data?.data;
  const attr = bill?.attributes;
  const isPaid = attr?.paid_dates && attr.paid_dates.length > 0;

  if (billQuery.isLoading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  const statusColor = isPaid ? colors.success : colors.warning;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={billQuery.isRefetching} onRefresh={() => billQuery.refetch()} tintColor={colors.primary} />}>

        <ScreenNavBar
          title={attr?.name || 'Bill'}
          rightActions={<NavActionButton icon="edit" color={colors.primary} bgColor={colors.surface} onPress={() => router.push(`/modals/bill-form?id=${id}` as any)} />}
        />

        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: statusColor }]}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.heroIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <MaterialIcons name={isPaid ? 'check-circle' : 'schedule'} size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.heroName}>{attr?.name}</Text>
            <Text style={styles.heroAmount}>
              {formatCurrency(attr?.amount_min, attr?.currency_symbol)} – {formatCurrency(attr?.amount_max, attr?.currency_symbol)}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={styles.statusText}>{isPaid ? 'Paid' : 'Unpaid'}</Text>
            </View>
          </View>
        </View>

        {/* Details Card */}
        <View style={[styles.detailCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <InfoRow icon="event-repeat" label="Frequency" value={(attr?.repeat_freq || '').charAt(0).toUpperCase() + (attr?.repeat_freq || '').slice(1)} colors={colors} />
          <InfoRow icon="event" label="Start Date" value={attr?.date ? formatDate(attr.date) : '—'} colors={colors} />
          <InfoRow icon="event-available" label="Next Expected" value={attr?.next_expected_match ? formatDate(attr.next_expected_match) : 'N/A'} colors={colors} />
          <InfoRow icon="toggle-on" label="Active" value={attr?.active ? 'Yes' : 'No'} colors={colors} />
          {attr?.notes ? <InfoRow icon="notes" label="Notes" value={attr.notes} colors={colors} /> : null}
        </View>

        {/* Paid Dates */}
        {attr?.paid_dates && attr.paid_dates.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Payment History</Text>
            {attr.paid_dates.map((pd: any, i: number) => (
              <View key={i} style={[styles.paidCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.paidIcon, { backgroundColor: colors.success + '14' }]}>
                  <MaterialIcons name="check-circle" size={16} color={colors.success} />
                </View>
                <Text style={[styles.paidDate, { color: colors.foreground }]}>{formatDate(pd.date)}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
}

function InfoRow({ icon, label, value, colors }: { icon: string; label: string; value: string; colors: any }) {
  if (!value) return null;
  return (
    <View style={[infoStyles.row, { borderBottomColor: colors.border }]}>
      <MaterialIcons name={icon as any} size={16} color={colors.muted} style={{ marginRight: 10, marginTop: 1 }} />
      <View style={infoStyles.content}>
        <Text style={[infoStyles.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, marginHorizontal: 16 },
  content: { flex: 1 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  value: { fontSize: 14, fontWeight: '500' },
});

const styles = StyleSheet.create({
  heroCard: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  heroContent: { padding: 24, alignItems: 'center' },
  heroIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroName: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroAmount: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5, marginBottom: 12 },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  detailCard: { marginHorizontal: 16, borderRadius: 18, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  section: { paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  paidCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 6 },
  paidIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  paidDate: { fontSize: 14, fontWeight: '500' },
});
