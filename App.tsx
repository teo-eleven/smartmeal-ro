import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { OnboardingWizard } from './src/screens/onboarding/OnboardingWizard';
import { GeneratingPlanModal } from './src/screens/onboarding/GeneratingPlanModal';
import { MealBoardScreen } from './src/screens/MealBoardScreen';
import { GroceryScreen } from './src/screens/GroceryScreen';
import { AuthModal } from './src/screens/AuthModal';
import { SUPERMARKETS } from './src/data/supermarkets';

export default function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const {
    activeView,
    currentPlan,
    groceryItems,
    userEmail,
    isSyncing,
    lastSyncedAt,
    setActiveView,
    resetOnboarding,
    hydrateStorage,
    setUserEmail,
    syncWithCloud,
  } = useAppStore();

  useEffect(() => {
    void hydrateStorage();
  }, [hydrateStorage]);

  const theme = {
    background: isDark ? '#0b1120' : '#f8fafc',
    card: isDark ? '#131d31' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.16)' : '#ecfdf5',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    accentBg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9',
    glassBg: isDark ? 'rgba(19, 29, 49, 0.85)' : 'rgba(255, 255, 255, 0.9)',
  };

  // If in onboarding wizard
  if (activeView === 'onboarding') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <OnboardingWizard isDark={isDark} onPlanGenerated={() => setActiveView('meals')} />
      </SafeAreaView>
    );
  }

  // If in generating animation
  if (activeView === 'generating') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <GeneratingPlanModal isDark={isDark} onComplete={() => setActiveView('meals')} />
      </SafeAreaView>
    );
  }

  // Active Meal Plan & Grocery Dashboard
  const market = currentPlan ? SUPERMARKETS[currentPlan.supermarketId] : null;
  const purchasedCount = groceryItems.filter((i) => i.isPurchased).length;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Main Container */}
      <View style={styles.dashboardContainer}>
        {/* Top App Bar with VisionOS-inspired translucent card style */}
        <View style={[styles.topBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View>
            <View style={styles.brandRow}>
              <Text style={[styles.brandTitle, { color: theme.text }]}>SmartMeal</Text>
              <View style={[styles.brandBadge, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.brandBadgeText, { color: theme.primary }]}>RO 🇷🇴</Text>
              </View>
            </View>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
              {market ? `${market.name} • ${currentPlan?.peopleCount} pers` : 'Meniu activ'}
            </Text>
          </View>

          <View style={styles.topBarActions}>
            <TouchableOpacity
              onPress={() => setAuthModalVisible(true)}
              style={[
                styles.syncBtn,
                {
                  backgroundColor: userEmail ? theme.primaryLight : theme.accentBg,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.syncBtnText,
                  { color: userEmail ? theme.primary : theme.textMuted },
                ]}
              >
                {userEmail ? '☁️ Sincron' : '☁️ Cloud'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetOnboarding}
              style={[styles.resetBtn, { backgroundColor: theme.primaryLight }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetBtnText, { color: theme.primary }]}>+ Plan Nou</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Futuristic Floating Segmented Dock */}
        <View style={styles.tabsDockContainer}>
          <View style={[styles.tabsDock, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => setActiveView('meals')}
              activeOpacity={0.8}
              style={[
                styles.dockItem,
                activeView === 'meals' && [
                  styles.dockItemActive,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.dockItemText,
                  {
                    color: activeView === 'meals' ? theme.primary : theme.textMuted,
                    fontWeight: activeView === 'meals' ? '800' : '600',
                  },
                ]}
              >
                🍽️ Mese ({currentPlan?.days.length ?? 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveView('grocery')}
              activeOpacity={0.8}
              style={[
                styles.dockItem,
                activeView === 'grocery' && [
                  styles.dockItemActive,
                  { backgroundColor: theme.primaryLight, borderColor: theme.primary },
                ],
              ]}
            >
              <Text
                style={[
                  styles.dockItemText,
                  {
                    color: activeView === 'grocery' ? theme.primary : theme.textMuted,
                    fontWeight: activeView === 'grocery' ? '800' : '600',
                  },
                ]}
              >
                🛒 Cumpărături ({purchasedCount}/{groceryItems.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* VIEW BODY */}
        {activeView === 'meals' && <MealBoardScreen isDark={isDark} />}
        {activeView === 'grocery' && <GroceryScreen isDark={isDark} />}
      </View>

      {/* Cloud & Auth Sync Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        isDark={isDark}
        userEmail={userEmail}
        onUserChanged={(email) => setUserEmail(email)}
        onSyncTriggered={syncWithCloud}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  topBar: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  syncBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  tabsDockContainer: {
    width: '100%',
    maxWidth: 480,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tabsDock: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
  },
  dockItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  dockItemActive: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  dockItemText: {
    fontSize: 13,
  },
});
