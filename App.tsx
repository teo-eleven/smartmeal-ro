import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useAppStore } from './src/store/useAppStore';
import { ThemeMode } from './src/types';
import { OnboardingWizard } from './src/screens/onboarding/OnboardingWizard';
import { GeneratingPlanModal } from './src/screens/onboarding/GeneratingPlanModal';
import { MealBoardScreen } from './src/screens/MealBoardScreen';
import { GroceryScreen } from './src/screens/GroceryScreen';
import { AuthModal } from './src/screens/AuthModal';
import { InformativeNoticeModal } from './src/components/InformativeNoticeModal';
import { ConfirmDialog } from './src/components/ConfirmDialog';
import { SUPERMARKETS } from './src/data/supermarkets';
import { useResponsive } from './src/hooks/useResponsive';
import { injectEmeraldGlassStyles, getAppTheme } from './src/styles/theme';
import { glass } from './src/styles/glass';
import { UndoBanner } from './src/components/UndoBanner';

const THEME_ICONS: Record<ThemeMode, string> = { system: '🌗', light: '☀️', dark: '🌙' };
const THEME_LABELS: Record<ThemeMode, string> = {
  system: 'ca telefonul',
  light: 'luminoasă',
  dark: 'întunecată',
};

export default function App() {
  const colorScheme = useColorScheme();
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const {
    themeMode,
    cycleThemeMode,
    activeView,
    currentPlan,
    groceryItems,
    userEmail,
    isSyncing,
    lastSyncedAt,
    activeNotice,
    clearNotice,
    confirmRequest,
    pendingCloudPlan,
    requestConfirm,
    cancelConfirm,
    confirmPending,
    lastDiscardedPlan,
    undoReset,
    dismissUndo,
    setActiveView,
    hydrateStorage,
    setUserEmail,
    syncWithCloud,
    syncFromCloud,
    generatePlan,
  } = useAppStore();

  // The phone's setting is the default; an explicit choice overrides it.
  const isDark = themeMode === 'system' ? colorScheme === 'dark' : themeMode === 'dark';

  const { isDesktop, contentMaxWidth } = useResponsive();

  const viewFadeAnim = useRef(new Animated.Value(1)).current;
  const viewSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    injectEmeraldGlassStyles(isDark);
  }, [isDark]);

  useEffect(() => {
    void hydrateStorage();
  }, [hydrateStorage]);

  useEffect(() => {
    viewFadeAnim.setValue(0.35);
    viewSlideAnim.setValue(10);
    Animated.parallel([
      Animated.timing(viewFadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(viewSlideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeView, viewFadeAnim, viewSlideAnim]);

  // Apple iOS Black & White Minimalist Theme Tokens
  const theme = getAppTheme(isDark);

  // If in onboarding wizard
  if (activeView === 'onboarding') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background }]}
        {...glass('root')}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <OnboardingWizard isDark={isDark} onPlanGenerated={() => setActiveView('meals')} />
        <UndoBanner
          visible={Boolean(lastDiscardedPlan)}
          message="Planul săptămânal a fost șters."
          actionLabel="Anulează ștergerea"
          onAction={undoReset}
          onDismiss={dismissUndo}
          isDark={isDark}
        />
        <InformativeNoticeModal notice={activeNotice} onDismiss={clearNotice} isDark={isDark} />
      </SafeAreaView>
    );
  }

  // If in generating animation
  if (activeView === 'generating') {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background }]}
        {...glass('root')}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <GeneratingPlanModal
          isDark={isDark}
          onComplete={() => {
            if (!useAppStore.getState().currentPlan) {
              generatePlan();
            }
            setActiveView('meals');
          }}
        />
        <InformativeNoticeModal notice={activeNotice} onDismiss={clearNotice} isDark={isDark} />
      </SafeAreaView>
    );
  }

  // Active Meal Plan & Grocery Dashboard
  const market = currentPlan ? SUPERMARKETS[currentPlan.supermarketId] : null;
  const purchasedCount = groceryItems.filter((i) => i.isPurchased).length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background }]}
      {...glass('root')}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Main Container */}
      <View style={styles.dashboardContainer}>
        {/* Top App Bar with VisionOS-inspired translucent card style */}
        <View
          {...glass('card')}
          style={[
            styles.topBar,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              maxWidth: contentMaxWidth,
            },
          ]}
        >
          <View style={styles.brandContainer}>
            <View style={styles.brandRow}>
              <Text style={[styles.brandTitle, { color: theme.text }]}>SmartMeal</Text>
              <View style={[styles.brandBadge, { backgroundColor: theme.surfaceTertiary, borderColor: theme.border, borderWidth: 1 }]}>
                <Text style={[styles.brandBadgeText, { color: theme.text }]}>RO 🇷🇴</Text>
              </View>
            </View>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
              {market ? `${market.name} • ${currentPlan?.peopleCount} pers` : 'Meniu activ'}
            </Text>
          </View>

          {/* Desktop Navigation Tabs */}
          {isDesktop && (
            <View
              {...glass('dock')}
              style={[styles.desktopTabsDock, { backgroundColor: theme.btnBg, borderColor: theme.border }]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setActiveView('meals')}
                activeOpacity={0.8}
                {...glass(activeView === 'meals' ? 'pill-active' : 'pill')}
                style={[
                  styles.dockItem,
                  activeView === 'meals' && [
                    styles.dockItemActive,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.dockItemText,
                    {
                      color: activeView === 'meals' ? theme.primaryText : theme.textMuted,
                      fontWeight: activeView === 'meals' ? '800' : '600',
                    },
                  ]}
                >
                  🍽️ Mese ({currentPlan?.days.length ?? 0} zile)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setActiveView('grocery')}
                activeOpacity={0.8}
                {...glass(activeView === 'grocery' ? 'pill-active' : 'pill')}
                style={[
                  styles.dockItem,
                  activeView === 'grocery' && [
                    styles.dockItemActive,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.dockItemText,
                    {
                      color: activeView === 'grocery' ? theme.primaryText : theme.textMuted,
                      fontWeight: activeView === 'grocery' ? '800' : '600',
                    },
                  ]}
                >
                  🛒 Cumpărături ({purchasedCount}/{groceryItems.length})
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.topBarActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Temă: ${THEME_LABELS[themeMode]}. Apasă pentru a schimba.`}
              onPress={cycleThemeMode}
              {...glass('pill')}
              style={[styles.syncBtn, { backgroundColor: theme.accentBg, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <Text style={[styles.syncBtnText, { color: theme.textMuted }]}>
                {THEME_ICONS[themeMode]}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => setAuthModalVisible(true)}
              {...glass('pill')}
              style={[
                styles.syncBtn,
                {
                  backgroundColor: userEmail ? theme.surfaceTertiary : theme.accentBg,
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.syncBtnText,
                  { color: userEmail ? theme.text : theme.textMuted },
                ]}
              >
                {userEmail ? '☁️ Sincron' : '☁️ Cloud'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => requestConfirm('reset_onboarding')}
              {...glass('btn-primary')}
              style={[styles.resetBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetBtnText, { color: theme.primaryText }]}>+ Plan Nou</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Floating Segmented Dock (Only on mobile screen) */}
        {!isDesktop && (
          <View style={styles.tabsDockContainer}>
            <View
              {...glass('dock')}
              style={[styles.tabsDock, { backgroundColor: theme.card, borderColor: theme.border }]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setActiveView('meals')}
                activeOpacity={0.8}
                {...glass(activeView === 'meals' ? 'pill-active' : 'pill')}
                style={[
                  styles.dockItem,
                  activeView === 'meals' && [
                    styles.dockItemActive,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.dockItemText,
                    {
                      color: activeView === 'meals' ? theme.primaryText : theme.textMuted,
                      fontWeight: activeView === 'meals' ? '800' : '600',
                    },
                  ]}
                >
                  🍽️ Mese ({currentPlan?.days.length ?? 0})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setActiveView('grocery')}
                activeOpacity={0.8}
                {...glass(activeView === 'grocery' ? 'pill-active' : 'pill')}
                style={[
                  styles.dockItem,
                  activeView === 'grocery' && [
                    styles.dockItemActive,
                    { backgroundColor: theme.primary, borderColor: theme.primary },
                  ],
                ]}
              >
                <Text
                  style={[
                    styles.dockItemText,
                    {
                      color: activeView === 'grocery' ? theme.primaryText : theme.textMuted,
                      fontWeight: activeView === 'grocery' ? '800' : '600',
                    },
                  ]}
                >
                  🛒 Cumpărături ({purchasedCount}/{groceryItems.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* VIEW BODY WITH SMOOTH TRANSITION ANIMATION */}
        <Animated.View
          style={[
            styles.viewBodyAnimated,
            {
              opacity: viewFadeAnim,
              transform: [{ translateY: viewSlideAnim }],
            },
          ]}
        >
          {activeView === 'meals' && <MealBoardScreen isDark={isDark} />}
          {activeView === 'grocery' && <GroceryScreen isDark={isDark} />}
        </Animated.View>
      </View>

      {/* Cloud & Auth Sync Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
        isDark={isDark}
        userEmail={userEmail}
        onUserChanged={(email) => setUserEmail(email)}
        onSyncTriggered={syncWithCloud}
        onDownloadTriggered={syncFromCloud}
        isSyncing={isSyncing}
        lastSyncedAt={lastSyncedAt}
      />

      {/* Global Informative Notice Pop-up */}
      <InformativeNoticeModal notice={activeNotice} onDismiss={clearNotice} isDark={isDark} />

        <UndoBanner
          visible={Boolean(lastDiscardedPlan)}
          message="Planul săptămânal a fost șters."
          actionLabel="Anulează ștergerea"
          onAction={undoReset}
          onDismiss={dismissUndo}
          isDark={isDark}
        />

      {/* Replacing a live plan with the one another device saved */}
      <ConfirmDialog
        visible={confirmRequest === 'apply_cloud_plan'}
        title="Înlocuiești planul de aici?"
        message={
          pendingCloudPlan?.updatedAt
            ? `Planul din cloud a fost salvat pe ${new Date(pendingCloudPlan.updatedAt).toLocaleString('ro-RO')}. Îl aduci peste cel de aici? Poți reveni imediat cu „Anulează".`
            : 'Aduci planul salvat pe celălalt dispozitiv peste cel de aici? Poți reveni imediat cu „Anulează".'
        }
        confirmLabel="Adu planul din cloud"
        cancelLabel="Păstrează ce am aici"
        onConfirm={confirmPending}
        onCancel={cancelConfirm}
        isDark={isDark}
      />

      {/* Confirmation before anything is destroyed */}
      <ConfirmDialog
        visible={confirmRequest === 'reset_onboarding'}
        title="Ștergi planul curent?"
        message="Se șterg meniul săptămânal, lista de cumpărături și preferințele salvate. Acțiunea nu poate fi anulată."
        confirmLabel="Șterge și începe din nou"
        cancelLabel="Păstrează planul"
        isDestructive
        onConfirm={confirmPending}
        onCancel={cancelConfirm}
        isDark={isDark}
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
  viewBodyAnimated: {
    flex: 1,
    width: '100%',
  },
  topBar: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  brandContainer: {
    minWidth: 140,
  },
  desktopTabsDock: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 3,
    minWidth: 380,
    maxWidth: 520,
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
