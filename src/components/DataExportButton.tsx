import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { collectDataExport } from '../services/dataExport';
import { useAppStore } from '../store/useAppStore';
import { getAppTheme } from '../styles/theme';

interface DataExportButtonProps {
  isDark: boolean;
}

const FILE_NAME = 'smartmeal-datele-mele.json';

/**
 * On the web a download is what people expect; on a phone the share sheet is the download,
 * since it offers Files, Drive, email and the rest.
 */
async function hand(json: string): Promise<void> {
  if (Platform.OS === 'web') {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = FILE_NAME;
    link.click();
    URL.revokeObjectURL(url);
    return;
  }
  await Share.share({ title: FILE_NAME, message: json });
}

/** GDPR art. 15 and 20 from inside the app, rather than only by writing to us. */
export const DataExportButton: React.FC<DataExportButtonProps> = ({ isDark }) => {
  const theme = getAppTheme(isDark);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePress = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const { preferences, currentPlan, groceryItems, savedPlans, reminders } =
        useAppStore.getState();
      const data = await collectDataExport({
        preferences,
        currentPlan,
        groceryItems,
        savedPlans,
        reminders,
      });
      await hand(JSON.stringify(data, null, 2));
    } catch {
      setError('Nu am putut pregăti exportul. Încearcă din nou.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Descarcă datele mele"
        onPress={handlePress}
        disabled={isBusy}
        style={[styles.button, { borderColor: theme.border }]}
      >
        {isBusy ? (
          <ActivityIndicator color={theme.text} size="small" />
        ) : (
          <Text style={[styles.text, { color: theme.text }]}>⬇ Descarcă datele mele (JSON)</Text>
        )}
      </TouchableOpacity>
      {error && <Text style={[styles.error, { color: '#ef4444' }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  text: { fontSize: 14, fontWeight: '700' },
  error: { fontSize: 12, marginTop: -4, marginBottom: 10 },
});
