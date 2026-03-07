import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenNavBar, NavActionButton, EmptyState } from '@/components/ui/styled-list-screen';

export default function PiggyBankDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [addAmount, setAddAmount] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const piggyQuery = useQuery({ queryKey: ['piggy-bank', id], queryFn: () => api.getPiggyBank(id!), enabled: !!id });
  const eventsQuery = useQuery({ queryKey: ['piggy-bank-events', id], queryFn: () => api.getPiggyBankEvents(id!), enabled: !!id });

  const piggy = piggyQuery.data?.data;
  const attr = piggy?.attributes;
  const events = eventsQuery.data?.data || [];
  const current = parseFloat(attr?.current_amount || '0');
  const target = parseFloat(attr?.target_amount || '0');
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const barColor = percentage >= 100 ? '#10B981' : percentage > 60 ? colors.primary : colors.warning;

  const handleAddMoney = async (isAdd: boolean) => {
    const amt = parseFloat(addAmount);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    try {
      const newAmount = isAdd ? current + amt : Math.max(0, current - amt);
      await api.updatePiggyBank(id!, { current_amount: String(newAmount) });
      queryClient.invalidateQueries({ queryKey: ['piggy-bank', id] });
      queryClient.invalidateQueries({ queryKey: ['piggy-bank-events', id] });
      setAddAmount('');
      setShowAddForm(false);
    } catch (e: any) { Alert.alert('Error', e.message); }
  };

  if (piggyQuery.isLoading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={piggyQuery.isRefetching} onRefresh={() => { piggyQuery.refetch(); eventsQuery.refetch(); }} tintColor={colors.primary} />}>

        <ScreenNavBar
          title={attr?.name || 'Piggy Bank'}
          rightActions={<NavActionButton icon="edit" color={colors.primary} bgColor={colors.surface} onPress={() => router.push(`/modals/piggy-form?id=${id}` as any)} />}
        />

        {/* Hero Progress Card */}
        <View style={[styles.heroCard, { backgroundColor: barColor }]}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <View style={[styles.heroIconBg, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <MaterialIcons name="savings" size={24} color="#FFFFFF" />
            </View>
            <Text style={styles.heroName}>{attr?.name}</Text>
            <Text style={styles.heroAmount}>{formatCurrency(current, attr?.currency_symbol)}</Text>
            {target > 0 ? (
              <>
                <Text style={styles.heroTarget}>of {formatCurrency(target, attr?.currency_symbol)}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                  <View style={[styles.pctBadge, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Text style={styles.pctText}>{percentage.toFixed(0)}%</Text>
                  </View>
                  <Text style={styles.remainingText}>{formatCurrency(Math.max(target - current, 0), attr?.currency_symbol)} to go</Text>
                </View>
              </>
            ) : null}
            {attr?.target_date ? <Text style={styles.dateText}>Target: {formatDate(attr.target_date)}</Text> : null}
          </View>
        </View>

        {/* Notes */}
        {attr?.notes ? (
          <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MaterialIcons name="notes" size={16} color={colors.muted} />
            <Text style={[styles.notesText, { color: colors.foreground }]}>{attr.notes}</Text>
          </View>
        ) : null}

        {/* Add/Remove Money */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.success + '12', borderColor: colors.success + '30' }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <MaterialIcons name="add-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.actionText, { color: colors.success }]}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.error + '12', borderColor: colors.error + '30' }]}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <MaterialIcons name="remove-circle-outline" size={18} color={colors.error} />
            <Text style={[styles.actionText, { color: colors.error }]}>Remove</Text>
          </TouchableOpacity>
        </View>

        {showAddForm ? (
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
              placeholder="Amount"
              placeholderTextColor={colors.muted}
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
            <View style={styles.formBtns}>
              <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.success }]} onPress={() => handleAddMoney(true)}>
                <Text style={styles.formBtnText}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.formBtn, { backgroundColor: colors.error }]} onPress={() => handleAddMoney(false)}>
                <Text style={styles.formBtnText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Events */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>History</Text>
          <Text style={[styles.sectionCount, { color: colors.muted }]}>{events.length}</Text>
        </View>

        {eventsQuery.isLoading ? <ActivityIndicator color={colors.primary} /> :
          events.length === 0 ? (
            <View style={{ paddingHorizontal: 16 }}>
              <EmptyState icon="history" title="No events yet" subtitle="Add or remove money to see history" />
            </View>
          ) :
          events.map((event: any) => {
            const ea = event.attributes;
            const amt = parseFloat(ea.amount || '0');
            const isPositive = amt >= 0;
            return (
              <View key={event.id} style={[styles.eventCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.eventIcon, { backgroundColor: (isPositive ? colors.success : colors.error) + '14' }]}>
                  <MaterialIcons name={isPositive ? 'arrow-upward' : 'arrow-downward'} size={16} color={isPositive ? colors.success : colors.error} />
                </View>
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventAmount, { color: isPositive ? colors.success : colors.error }]}>
                    {isPositive ? '+' : ''}{formatCurrency(amt, attr?.currency_symbol)}
                  </Text>
                  <Text style={[styles.eventDate, { color: colors.muted }]}>{formatDate(ea.created_at || ea.date)}</Text>
                </View>
              </View>
            );
          })
        }
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heroCard: { marginHorizontal: 16, borderRadius: 22, overflow: 'hidden', marginBottom: 16 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.05)' },
  heroContent: { padding: 24, alignItems: 'center' },
  heroIconBg: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  heroName: { fontSize: 16, fontWeight: '600', color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroAmount: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  heroTarget: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: 16 },
  progressTrack: { width: '100%', height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 10 },
  pctBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pctText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  remainingText: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.8)' },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  notesCard: { flexDirection: 'row', marginHorizontal: 16, padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 16, gap: 10 },
  notesText: { flex: 1, fontSize: 13, lineHeight: 19 },
  actionRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  actionText: { fontSize: 14, fontWeight: '600' },
  formCard: { marginHorizontal: 16, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 16 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, textAlign: 'center', marginBottom: 12 },
  formBtns: { flexDirection: 'row', gap: 10 },
  formBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  formBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionCount: { fontSize: 13, fontWeight: '500' },
  eventCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 12, borderRadius: 14, borderWidth: 1 },
  eventIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  eventInfo: { flex: 1 },
  eventAmount: { fontSize: 15, fontWeight: '700' },
  eventDate: { fontSize: 11, marginTop: 2 },
});
