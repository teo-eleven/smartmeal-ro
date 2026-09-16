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
    background: isDark ? '#0f172a' : '#f8fafc',
    card: isDark ? '#1e293b' : '#ffffff',
    text: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    primary: '#10b981',
    primaryLight: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ecfdf5',
    border: isDark ? '#334155' : '#e2e8f0',
    accentBg: isDark ? '#1e293b' : '#f1f5f9',
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
        {/* Top App Bar */}
        <View style={[styles.topBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View>
            <Text style={[styles.brandTitle, { color: theme.primary }]}>SmartMeal RO</Text>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
              {market ? `${market.name} • ${currentPlan?.peopleCount} persoane` : 'Meniu activ'}
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
            >
              <Text
                style={[
                  styles.syncBtnText,
                  { color: userEmail ? theme.primary : theme.textMuted },
                ]}
              >
                {userEmail ? '☁️ Sincronizat' : '☁️ Cloud Sync'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={resetOnboarding}
              style={[styles.resetBtn, { backgroundColor: theme.primaryLight }]}
            >
              <Text style={[styles.resetBtnText, { color: theme.primary }]}>+ Plan Nou</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* View Switcher Tabs */}
        <View style={[styles.tabsRow, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={() => setActiveView('meals')}
            style={[
              styles.tabBtn,
              activeView === 'meals' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeView === 'meals' ? theme.primary : theme.textMuted },
              ]}
            >
              🍽️ Mesele Săptămânii ({currentPlan?.days.length ?? 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveView('grocery')}
            style={[
              styles.tabBtn,
              activeView === 'grocery' && { borderBottomColor: theme.primary, borderBottomWidth: 3 },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeView === 'grocery' ? theme.primary : theme.textMuted },
              ]}
            >
              🛒 Cumpărături ({purchasedCount}/{groceryItems.length})
            </Text>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: '700',
  },
  resetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  tabsRow: {
    width: '100%',
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
