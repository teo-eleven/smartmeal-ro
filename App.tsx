import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  AppState,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { useAppStore } from './src/store/useAppStore';
import { OnboardingWizard } from './src/screens/onboarding/OnboardingWizard';
import { GeneratingPlanModal } from './src/screens/onboarding/GeneratingPlanModal';
import { MealBoardScreen } from './src/screens/MealBoardScreen';
import { GroceryScreen } from './src/screens/GroceryScreen';
import { AuthModal } from './src/screens/AuthModal';
import { AuthGate, isGateShowing } from './src/screens/AuthGate';
import { BiometricOptInPrompt } from './src/components/BiometricOptInPrompt';
import { InformativeNoticeModal } from './src/components/InformativeNoticeModal';
import { ConfirmDialog } from './src/components/ConfirmDialog';
import { SUPERMARKETS } from './src/data/supermarkets';
import { useResponsive } from './src/hooks/useResponsive';
import { useAccountSession } from './src/hooks/useAccountSession';
import { injectEmeraldGlassStyles, getAppTheme } from './src/styles/theme';
import { glass } from './src/styles/glass';
import { UndoBanner } from './src/components/UndoBanner';
import { undoBannerCopy } from './src/utils/undoBannerCopy';
import { PaywallScreen } from './src/screens/PaywallScreen';
import { useSubscriptionStore } from './src/store/subscriptionStore';
import { cloudSyncService } from './src/services/supabase';
import { AppLoadingScreen } from './src/components/AppLoadingScreen';
import { LoadingToast } from './src/components/LoadingToast';
import { useShallow } from 'zustand/react/shallow';

function AppShell() {
  const [authModalVisible, setAuthModalVisible] = useState(false);

  const {
    authStatus,
    isHydrated,
    activeView,
    currentPlan,
    groceryItems,
    userEmail,
    isSyncing,
    isReloading,
    reloadConfig,
    lastSyncedAt,
    activeNotice,
    clearNotice,
    confirmRequest,
    pendingCloudPlan,
    cloudConflictVersion,
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
  } = useAppStore(
    useShallow((state) => ({
      authStatus: state.authStatus,
      isHydrated: state.isHydrated,
      activeView: state.activeView,
      currentPlan: state.currentPlan,
      groceryItems: state.groceryItems,
      userEmail: state.userEmail,
      isSyncing: state.isSyncing,
      isReloading: state.isReloading,
      reloadConfig: state.reloadConfig,
      lastSyncedAt: state.lastSyncedAt,
      activeNotice: state.activeNotice,
      clearNotice: state.clearNotice,
      confirmRequest: state.confirmRequest,
      pendingCloudPlan: state.pendingCloudPlan,
      cloudConflictVersion: state.cloudConflictVersion,
      requestConfirm: state.requestConfirm,
      cancelConfirm: state.cancelConfirm,
      confirmPending: state.confirmPending,
      lastDiscardedPlan: state.lastDiscardedPlan,
      undoReset: state.undoReset,
      dismissUndo: state.dismissUndo,
      setActiveView: state.setActiveView,
      hydrateStorage: state.hydrateStorage,
      setUserEmail: state.setUserEmail,
      syncWithCloud: state.syncWithCloud,
      syncFromCloud: state.syncFromCloud,
      generatePlan: state.generatePlan,
    }))
  );

  // Permanently locked to the luxury Warm Forest & Amber Lantern theme
  const isDark = true;
  const undoCopy = undoBannerCopy(lastDiscardedPlan?.reason);

  const { isDesktop, isMobile, contentMaxWidth } = useResponsive();

  const viewFadeAnim = useRef(new Animated.Value(1)).current;
  const viewSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    injectEmeraldGlassStyles(isDark);
  }, [isDark]);

  useEffect(() => {
    void hydrateStorage();
  }, [hydrateStorage]);

  const subscription = useSubscriptionStore((s) => s.status);
  const isSubscriptionChecked = useSubscriptionStore((s) => s.isChecked);

  // Read once the stored session is known, then again whenever the app comes back to the
  // foreground, so a renewal or an expiry shows without a restart.
  useEffect(() => {
    if (!isHydrated) return;
    const { isChecked, refresh } = useSubscriptionStore.getState();
    if (!isChecked) void refresh();
    const listener = AppState.addEventListener('change', (state) => {
      if (state === 'active') void useSubscriptionStore.getState().refresh();
    });
    return () => listener.remove();
  }, [isHydrated]);

  useAccountSession(isHydrated, userEmail);

  // The subscription follows the account: on sign-in it is linked to the account's id, so a
  // second phone signed in to it is unlocked too; on sign-out it is unlinked.
  const previousEmail = useRef(userEmail);
  useEffect(() => {
    if (!isHydrated || previousEmail.current === userEmail) return;
    previousEmail.current = userEmail;
    void (async () => {
      const user = userEmail ? await cloudSyncService.getCurrentUser() : null;
      await useSubscriptionStore.getState().switchAccount(user?.id ?? null);
    })();
  }, [userEmail, isHydrated]);

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

  // Nothing of the app shows until there is someone to show it to: a spinner while the
  // stored session is read, the login for nobody, the re-verification past the month.
  if (isGateShowing(isHydrated, authStatus)) {
    return <AuthGate isDark={isDark} />;
  }

  if (activeView === 'onboarding') {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background },
        ]}
        {...glass('root')}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <OnboardingWizard
          isDark={isDark}
          onPlanGenerated={() => setActiveView('meals')}
          onOpenAccount={() => setAuthModalVisible(true)}
        />
        <AuthModal
          visible={authModalVisible}
          onClose={() => setAuthModalVisible(false)}
          isDark={isDark}
          userEmail={userEmail}
          onUserChanged={setUserEmail}
          onSyncTriggered={syncWithCloud}
          onDownloadTriggered={syncFromCloud}
          isSyncing={isSyncing}
          lastSyncedAt={lastSyncedAt}
        />
        <UndoBanner
          visible={Boolean(lastDiscardedPlan)}
          message={undoCopy.message}
          actionLabel={undoCopy.actionLabel}
          onAction={undoReset}
          onDismiss={dismissUndo}
          resetKey={lastDiscardedPlan}
          isDark={isDark}
        />
        <InformativeNoticeModal notice={activeNotice} onDismiss={clearNotice} isDark={isDark} />
        <BiometricOptInPrompt isDark={isDark} />
        <LoadingToast
          visible={isSyncing}
          message="Se sincronizează..."
          isDark={isDark}
        />
        {isReloading && (
          <AppLoadingScreen
            isDark={isDark}
            overlay
            title={reloadConfig?.title || 'Se reîncarcă datele...'}
            subtitle={reloadConfig?.subtitle}
            icon={reloadConfig?.icon || '🔄'}
            steps={reloadConfig?.steps}
            accessibilityLabel="Se reîncarcă datele"
          />
        )}
      </SafeAreaView>
    );
  }

  // Past the questionnaire, which stays free, the app needs the subscription. Until it has
  // been read, a branded loading screen: a paying person must never see the paywall flash on start.
  if (!isSubscriptionChecked) {
    return (
      <AppLoadingScreen
        isDark={isDark}
        title="Se verifică abonamentul..."
        subtitle="Validăm starea contului tău SmartMeal."
        accessibilityLabel="Se verifică abonamentul"
        onRetry={() => {
          void useSubscriptionStore.getState().refresh();
        }}
        retryLabel="Reîncearcă verificarea"
      />
    );
  }

  if (!subscription.isActive) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <PaywallScreen isDark={isDark} onBackToQuestions={() => setActiveView('onboarding')} />
        <InformativeNoticeModal notice={activeNotice} onDismiss={clearNotice} isDark={isDark} />
        <BiometricOptInPrompt isDark={isDark} />
      </SafeAreaView>
    );
  }

  // If in generating animation
  if (activeView === 'generating') {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background },
        ]}
        {...glass('root')}
      >
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
        <GeneratingPlanModal
          isDark={isDark}
          onComplete={() => {
            const hasPlan = Boolean(useAppStore.getState().currentPlan) || generatePlan();
            // Without a plan there is nothing to show on the board; back to the questions.
            setActiveView(hasPlan ? 'meals' : 'onboarding');
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
      style={[
        styles.safeArea,
        { backgroundColor: Platform.OS === 'web' ? 'transparent' : theme.background },
      ]}
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
            // On a phone the row held about 426 px of header in 390 (360 on many Samsungs),
            // and "+ Plan Nou" was cut off at the edge.
            isMobile && styles.topBarPhone,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              maxWidth: contentMaxWidth,
            },
          ]}
        >
          <View style={[styles.brandContainer, isMobile && styles.brandContainerPhone]}>
            <View style={styles.brandRow}>
              <Text style={[styles.brandTitle, { color: theme.text }]}>SmartMeal</Text>
              {!isMobile && (
                <View
                  style={[
                    styles.brandBadge,
                    {
                      backgroundColor: theme.surfaceTertiary,
                      borderColor: theme.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Text style={[styles.brandBadgeText, { color: theme.text }]}>RO 🇷🇴</Text>
                </View>
              )}
            </View>
            <Text style={[styles.brandSubtitle, { color: theme.textMuted }]}>
              {market ? `${market.name} • ${currentPlan?.peopleCount} pers` : 'Meniu activ'}
            </Text>
          </View>

          {/* Desktop Navigation Tabs */}
          {isDesktop && (
            <View
              {...glass('dock')}
              style={[
                styles.desktopTabsDock,
                { backgroundColor: theme.btnBg, borderColor: theme.border },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{ selected: activeView === 'meals' }}
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
                accessibilityState={{ selected: activeView === 'grocery' }}
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
              accessibilityLabel="Contul meu"
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
                style={[styles.syncBtnText, { color: userEmail ? theme.text : theme.textMuted }]}
              >
                {/* It opens the account window, which is what the label now says. */}
                👤 Cont
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
                accessibilityState={{ selected: activeView === 'meals' }}
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
                accessibilityState={{ selected: activeView === 'grocery' }}
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
      <BiometricOptInPrompt isDark={isDark} />

      <UndoBanner
        visible={Boolean(lastDiscardedPlan)}
        message={undoCopy.message}
        actionLabel={undoCopy.actionLabel}
        onAction={undoReset}
        onDismiss={dismissUndo}
        resetKey={lastDiscardedPlan}
        isDark={isDark}
      />

      {/* Replacing a live plan with the one another device saved */}
      <ConfirmDialog
        visible={confirmRequest === 'apply_cloud_plan'}
        title="Înlocuiești planul de aici?"
        message={
          pendingCloudPlan?.updatedAt
            ? `Planul din cloud a fost salvat pe ${new Date(pendingCloudPlan.updatedAt).toLocaleString('ro-RO')}. Îl aduci peste cel de aici? Poți reveni imediat cu „Revino la planul anterior”.`
            : 'Aduci planul salvat pe celălalt dispozitiv peste cel de aici? Poți reveni imediat cu „Revino la planul anterior”.'
        }
        confirmLabel="Adu planul din cloud"
        cancelLabel="Păstrează ce am aici"
        onConfirm={confirmPending}
        onCancel={cancelConfirm}
        isDark={isDark}
      />

      {/* Saving found a newer plan in the cloud: nothing is replaced without asking. */}
      <ConfirmDialog
        visible={confirmRequest === 'overwrite_cloud_plan'}
        title="În cloud e un plan mai nou"
        message={`Pe ${cloudConflictVersion ? new Date(cloudConflictVersion).toLocaleString('ro-RO') : 'alt dispozitiv'} a fost salvat în cloud un plan pe care nu l-ai văzut aici. Dacă urci planul de pe acest telefon, îl înlocuiești. Ca să-l vezi întâi, apasă „⬇ Adu” la Sincronizare, în Cont.`}
        confirmLabel="Înlocuiește-l cu planul de aici"
        cancelLabel="Nu urca acum"
        isDestructive
        onConfirm={confirmPending}
        onCancel={cancelConfirm}
        isDark={isDark}
      />

      {/* Confirmation before anything is destroyed */}
      <ConfirmDialog
        visible={confirmRequest === 'reset_onboarding'}
        title="Ștergi planul curent?"
        message="Se șterg meniul săptămânal, lista de cumpărături și preferințele. Cămara și rețetele preferate rămân. Timp de câteva secunde poți reveni cu „Anulează ștergerea”."
        confirmLabel="Șterge și începe din nou"
        cancelLabel="Păstrează planul"
        isDestructive
        onConfirm={confirmPending}
        onCancel={cancelConfirm}
        isDark={isDark}
      />

      <LoadingToast
        visible={isSyncing}
        message="Se sincronizează..."
        isDark={isDark}
      />

      {isReloading && (
        <AppLoadingScreen
          isDark={isDark}
          overlay
          title={reloadConfig?.title || 'Se reîncarcă datele...'}
          subtitle={reloadConfig?.subtitle}
          icon={reloadConfig?.icon || '🔄'}
          steps={reloadConfig?.steps}
          accessibilityLabel="Se reîncarcă datele"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
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
  brandContainerPhone: {
    minWidth: 0,
    flexShrink: 1,
  },
  topBarPhone: {
    paddingHorizontal: 16,
    gap: 8,
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

/**
 * The shell has several exits and any of them can throw from a tap handler, which would
 * unmount the tree and leave a white screen. The boundary follows the phone's theme rather
 * than the user's override, because reading the store is exactly what might have failed.
 */
export default function App() {
  const colorScheme = useColorScheme();
  return (
    <ErrorBoundary isDark={colorScheme === 'dark'}>
      <AppShell />
    </ErrorBoundary>
  );
}
