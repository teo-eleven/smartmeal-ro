import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PrivacyPolicyLink, TermsLink } from '../components/PrivacyPolicyLink';
import { subscriptionService } from '../services/subscription';
import { SubscriptionOffer } from '../services/subscriptionParse';
import { useSubscriptionStore } from '../store/subscriptionStore';
import { getAppTheme } from '../styles/theme';

interface PaywallScreenProps {
  isDark: boolean;
  /** Back to the questionnaire, which stays free: someone may want to change an answer. */
  onBackToQuestions: () => void;
}

const BENEFITS = [
  'Meniul săptămânii, după bugetul, dieta și alergiile tale',
  'Lista de cumpărături pe raioane, cu prețuri estimate la magazinul tău',
  'Comparația aceluiași coș la 8 lanțuri de magazine',
  'Schimbi orice fel, gătești dublu, bifezi ce ai în cămară',
  'Mementouri și, cu cont, același plan pe toate telefoanele',
];

/**
 * The subscription screen, shown after the questionnaire and before the plan.
 *
 * Apple 3.1.2 asks that, before anyone subscribes, the screen says what they get, the price
 * and period as the store sets them, that it renews on its own and how to stop it; and that
 * it offers to restore a past purchase and links to the terms and the privacy policy. The
 * price and the trial come from the store, never from a constant here: a price written by
 * hand is wrong in every currency but one.
 */
export const PaywallScreen: React.FC<PaywallScreenProps> = ({ isDark, onBackToQuestions }) => {
  const theme = getAppTheme(isDark);
  const purchase = useSubscriptionStore((s) => s.purchase);
  const restore = useSubscriptionStore((s) => s.restore);
  const [offer, setOffer] = useState<SubscriptionOffer | null>(null);
  const [isLoadingOffer, setIsLoadingOffer] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isUnavailable = subscriptionService.mode() === 'unavailable';

  useEffect(() => {
    let cancelled = false;
    void subscriptionService.offer().then((result) => {
      if (cancelled) return;
      setOffer(result);
      setIsLoadingOffer(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const run = async (action: () => Promise<{ error: string | null }>) => {
    setIsBusy(true);
    setError(null);
    try {
      const { error: failure } = await action();
      setError(failure);
    } finally {
      setIsBusy(false);
    }
  };

  const hasTrial = Boolean(offer?.trialDays);
  const buyLabel = hasTrial ? `Începe cele ${offer?.trialDays} zile gratuite` : 'Abonează-te';
  const priceLine = offer
    ? hasTrial
      ? `${offer.trialDays} zile gratuit, apoi ${offer.priceString} pe lună`
      : `${offer.priceString} pe lună`
    : null;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Înapoi la întrebări"
          onPress={onBackToQuestions}
          style={styles.back}
        >
          <Text style={[styles.backText, { color: theme.textMuted }]}>← Înapoi la întrebări</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: theme.text }]}>Planul tău e gata</Text>
        <Text style={[styles.subtitle, { color: theme.textMuted }]}>
          Deblochează-l cu abonamentul SmartMeal RO.
        </Text>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {BENEFITS.map((line) => (
            <Text key={line} style={[styles.benefit, { color: theme.text }]}>
              ✓ {line}
            </Text>
          ))}
        </View>

        {isLoadingOffer ? (
          <ActivityIndicator color={theme.text} style={styles.loading} />
        ) : isUnavailable || !offer ? (
          <Text style={[styles.notice, { color: theme.text }]}>
            {isUnavailable
              ? 'Abonamentul se face din aplicația de pe telefon (iPhone sau Android).'
              : 'Oferta nu a putut fi încărcată. Verifică conexiunea și deschide din nou aplicația.'}
          </Text>
        ) : (
          <>
            <Text style={[styles.price, { color: theme.text }]}>{priceLine}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={buyLabel}
              onPress={() => void run(() => purchase(offer.packageId))}
              disabled={isBusy}
              style={[styles.buyBtn, { backgroundColor: theme.primary }]}
            >
              {isBusy ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <Text style={[styles.buyText, { color: theme.primaryText }]}>{buyLabel}</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {error && (
          <Text testID="paywall-error" style={styles.error}>
            {error}
          </Text>
        )}

        {/* Apple 3.1.2: the renewal terms, stated before anyone subscribes. */}
        <Text style={[styles.fineprint, { color: theme.textMuted }]}>
          Abonamentul se reînnoiește automat în fiecare lună, la prețul de mai sus, dacă nu îl
          anulezi cu cel puțin 24 de ore înainte de sfârșitul perioadei curente
          {hasTrial ? ', inclusiv a perioadei gratuite' : ''}. Plata se face prin contul tău Apple
          sau Google Play. Îl anulezi oricând din setările abonamentelor contului tău de magazin.
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Restaurează cumpărăturile"
          onPress={() => void run(restore)}
          disabled={isBusy || isUnavailable}
          style={styles.restore}
        >
          <Text style={[styles.restoreText, { color: theme.text }]}>Restaurează cumpărăturile</Text>
        </TouchableOpacity>

        <View style={styles.links}>
          <TermsLink isDark={isDark} />
          <PrivacyPolicyLink isDark={isDark} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24, maxWidth: 560, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 12 },
  backText: { fontSize: 13, fontWeight: '600' },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 6, marginBottom: 18 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, gap: 10, marginBottom: 22 },
  benefit: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  loading: { marginVertical: 24 },
  notice: { fontSize: 14, lineHeight: 20, marginBottom: 16, fontWeight: '600' },
  price: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  buyBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  buyText: { fontSize: 16, fontWeight: '900' },
  error: { color: '#ef4444', fontSize: 13, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  fineprint: { fontSize: 11, lineHeight: 16, marginTop: 18 },
  restore: { alignSelf: 'center', paddingVertical: 12, marginTop: 8 },
  restoreText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 4 },
});
