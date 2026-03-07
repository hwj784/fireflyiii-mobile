import React from 'react';
import { Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
}

const MENU_ITEMS: MenuItem[] = [
  { title: 'Categories', subtitle: 'Manage transaction categories', icon: 'category', route: '/details/categories' },
  { title: 'Tags', subtitle: 'Organize with tags', icon: 'local-offer', route: '/details/tags' },
  { title: 'Piggy Banks', subtitle: 'Savings goals', icon: 'savings', route: '/details/piggy-banks' },
  { title: 'Bills', subtitle: 'Recurring bills & subscriptions', icon: 'receipt-long', route: '/details/bills' },
  { title: 'Rules', subtitle: 'Automation rules', icon: 'rule', route: '/details/rules' },
  { title: 'Recurring', subtitle: 'Recurring transactions', icon: 'event-repeat', route: '/details/recurring' },
  { title: 'Reports', subtitle: 'Charts & analytics', icon: 'bar-chart', route: '/details/reports' },
  { title: 'Currencies', subtitle: 'Manage currencies', icon: 'currency-exchange', route: '/details/currencies' },
  { title: 'Settings', subtitle: 'Server & preferences', icon: 'settings', route: '/details/settings' },
];

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="px-4 pt-2 pb-3">
          <Text className="text-2xl font-bold text-foreground">More</Text>
        </View>

        <View className="px-4">
          {MENU_ITEMS.map((item, index) => (
            <TouchableOpacity
              key={item.route}
              className="bg-surface rounded-xl p-4 mb-2 border border-border flex-row items-center"
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                <MaterialIcons name={item.icon as any} size={22} color={colors.primary} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-medium text-foreground">{item.title}</Text>
                <Text className="text-xs text-muted">{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
