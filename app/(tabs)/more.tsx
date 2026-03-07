import React from 'react';
import { Text, View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface MenuItem {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  color?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function MoreScreen() {
  const colors = useColors();
  const router = useRouter();

  const SECTIONS: MenuSection[] = [
    {
      title: 'Organize',
      items: [
        { title: 'Categories', subtitle: 'Manage transaction categories', icon: 'category', route: '/details/categories', color: '#8B5CF6' },
        { title: 'Tags', subtitle: 'Organize with tags', icon: 'local-offer', route: '/details/tags', color: '#EC4899' },
        { title: 'Piggy Banks', subtitle: 'Savings goals & targets', icon: 'savings', route: '/details/piggy-banks', color: '#10B981' },
      ],
    },
    {
      title: 'Automate',
      items: [
        { title: 'Bills', subtitle: 'Recurring bills & subscriptions', icon: 'receipt-long', route: '/details/bills', color: '#F59E0B' },
        { title: 'Rules', subtitle: 'Automation rules', icon: 'rule', route: '/details/rules', color: '#6366F1' },
        { title: 'Recurring', subtitle: 'Recurring transactions', icon: 'event-repeat', route: '/details/recurring', color: '#14B8A6' },
      ],
    },
    {
      title: 'Insights',
      items: [
        { title: 'Reports', subtitle: 'Charts & analytics', icon: 'bar-chart', route: '/details/reports', color: '#3B82F6' },
        { title: 'Currencies', subtitle: 'Manage currencies', icon: 'currency-exchange', route: '/details/currencies', color: '#F97316' },
      ],
    },
    {
      title: 'System',
      items: [
        { title: 'Settings', subtitle: 'Server & preferences', icon: 'settings', route: '/details/settings', color: '#64748B' },
      ],
    },
  ];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>More</Text>
        </View>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, { color: colors.muted }]}>{section.title}</Text>
            <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.route}
                  style={[
                    styles.menuRow,
                    index < section.items.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                  onPress={() => router.push(item.route as any)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.menuIconBg, { backgroundColor: (item.color || colors.primary) + '14' }]}>
                    <MaterialIcons name={item.icon as any} size={20} color={item.color || colors.primary} />
                  </View>
                  <View style={styles.menuInfo}>
                    <Text style={[styles.menuTitle, { color: colors.foreground }]}>{item.title}</Text>
                    <Text style={[styles.menuSubtitle, { color: colors.muted }]}>{item.subtitle}</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={colors.border} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuInfo: {
    flex: 1,
    marginRight: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
});
