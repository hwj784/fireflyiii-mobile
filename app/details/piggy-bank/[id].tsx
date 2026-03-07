import React, { useState } from 'react';
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/helpers';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  if (piggyQuery.isLoading) {
    return <ScreenContainer className="items-center justify-center"><ActivityIndicator color={colors.primary} size="large" /></ScreenContainer>;
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={piggyQuery.isRefetching} onRefresh={() => { piggyQuery.refetch(); eventsQuery.refetch(); }} tintColor={colors.primary} />}>
        <View className="px-4 pt-2">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3"><MaterialIcons name="arrow-back" size={24} color={colors.foreground} /></TouchableOpacity>
            <Text className="text-xl font-bold text-foreground flex-1" numberOfLines={1}>{attr?.name}</Text>
            <TouchableOpacity onPress={() => router.push(`/modals/piggy-form?id=${id}` as any)}>
              <MaterialIcons name="edit" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Progress Card */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-4">
            <Text className="text-sm text-muted mb-1">Saved</Text>
            <Text className="text-3xl font-bold text-foreground">{formatCurrency(current, attr?.currency_symbol)}</Text>
            {target > 0 ? (
              <>
                <Text className="text-sm text-muted mt-1">of {formatCurrency(target, attr?.currency_symbol)}</Text>
                <View className="h-3 bg-border rounded-full overflow-hidden mt-3">
                  <View className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                </View>
                <Text className="text-xs text-muted mt-1">{percentage.toFixed(1)}% · {formatCurrency(Math.max(target - current, 0), attr?.currency_symbol)} remaining</Text>
              </>
            ) : null}
            {attr?.target_date ? <Text className="text-xs text-muted mt-2">Target date: {formatDate(attr.target_date)}</Text> : null}
            {attr?.notes ? <Text className="text-sm text-muted mt-2">{attr.notes}</Text> : null}
          </View>

          {/* Add/Remove Money */}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity className="flex-1 bg-success/10 rounded-xl py-3 items-center border border-success/30" onPress={() => setShowAddForm(!showAddForm)}>
              <Text className="text-sm font-medium text-success">Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-error/10 rounded-xl py-3 items-center border border-error/30" onPress={() => setShowAddForm(!showAddForm)}>
              <Text className="text-sm font-medium text-error">Remove Money</Text>
            </TouchableOpacity>
          </View>

          {showAddForm ? (
            <View className="bg-surface rounded-xl p-4 border border-border mb-4">
              <TextInput
                className="bg-background border border-border rounded-xl px-4 py-3 text-base text-foreground text-center mb-3"
                placeholder="Amount"
                placeholderTextColor={colors.muted}
                value={addAmount}
                onChangeText={setAddAmount}
                keyboardType="decimal-pad"
              />
              <View className="flex-row gap-2">
                <TouchableOpacity className="flex-1 bg-success rounded-xl py-2.5 items-center" onPress={() => handleAddMoney(true)}>
                  <Text className="text-white font-medium">Add</Text>
                </TouchableOpacity>
                <TouchableOpacity className="flex-1 bg-error rounded-xl py-2.5 items-center" onPress={() => handleAddMoney(false)}>
                  <Text className="text-white font-medium">Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Events */}
          <Text className="text-lg font-semibold text-foreground mb-2">Events</Text>
          {eventsQuery.isLoading ? <ActivityIndicator color={colors.primary} /> :
            events.length === 0 ? <Text className="text-muted text-center py-4">No events yet</Text> :
            events.map((event: any) => {
              const ea = event.attributes;
              const amt = parseFloat(ea.amount || '0');
              return (
                <View key={event.id} className="bg-surface rounded-xl p-3 border border-border mb-2 flex-row items-center">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: (amt >= 0 ? colors.success : colors.error) + '18' }}>
                    <MaterialIcons name={amt >= 0 ? 'arrow-upward' : 'arrow-downward'} size={16} color={amt >= 0 ? colors.success : colors.error} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium" style={{ color: amt >= 0 ? colors.success : colors.error }}>
                      {amt >= 0 ? '+' : ''}{formatCurrency(amt, attr?.currency_symbol)}
                    </Text>
                    <Text className="text-xs text-muted">{formatDate(ea.created_at || ea.date)}</Text>
                  </View>
                </View>
              );
            })
          }
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
