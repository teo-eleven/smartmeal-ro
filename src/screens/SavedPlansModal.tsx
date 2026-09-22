import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SavedPlan } from '../types';
import { SUPERMARKETS } from '../data/supermarkets';
import { getAppTheme } from '../styles/theme';
import { glass } from '../styles/glass';

interface SavedPlansModalProps {
  visible: boolean;
  savedPlans: SavedPlan[];
  canSaveCurrent: boolean;
  onSaveCurrent: (name: string) => void;
  onRestore: (savedPlanId: string) => void;
  onDelete: (savedPlanId: string) => void;
  onClose: () => void;
  isDark: boolean;
}

function formatSavedAt(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const SavedPlansModal: React.FC<SavedPlansModalProps> = ({
  visible,
  savedPlans,
  canSaveCurrent,
  onSaveCurrent,
  onRestore,
  onDelete,
  onClose,
  isDark,
}) => {
  const theme = getAppTheme(isDark);
  const [name, setName] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleSave = () => {
    onSaveCurrent(name);
    setName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          {...glass('modal')}
          style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border }]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>Planurile mele</Text>
              <Text style={[styles.subtitle, { color: theme.textMuted }]}>
                Salvează o săptămână reușită și repet-o oricând
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Închide"
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBtnText, { color: theme.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {canSaveCurrent && (
            <View style={[styles.saveRow, { borderColor: theme.border }]}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Nume (ex: Săptămâna ușoară)"
                placeholderTextColor={theme.textMuted}
                accessibilityLabel="Numele planului de salvat"
                style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              />
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Salvează planul curent"
                onPress={handleSave}
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.8}
              >
                <Text style={[styles.saveBtnText, { color: theme.primaryText }]}>Salvează</Text>
              </TouchableOpacity>
            </View>
          )}

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {savedPlans.length === 0 ? (
              <Text style={[styles.empty, { color: theme.textMuted }]}>
                Niciun plan salvat încă. Salvează-l pe cel curent ca să îl poți relua mai târziu,
                fără să refaci configurarea.
              </Text>
            ) : (
              savedPlans.map((entry) => {
                const market = SUPERMARKETS[entry.plan.supermarketId];
                const isPendingDelete = pendingDeleteId === entry.id;

                return (
                  <View key={entry.id} style={[styles.row, { borderColor: theme.border }]}>
                    <View style={styles.rowTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.planName, { color: theme.text }]} numberOfLines={1}>
                          {entry.name}
                        </Text>
                        <Text style={[styles.planMeta, { color: theme.textMuted }]}>
                          {formatSavedAt(entry.savedAt)} • {market?.name} • {entry.plan.days.length}{' '}
                          zile • {entry.plan.totalCartCostRon} lei
                        </Text>
                      </View>
                    </View>

                    {isPendingDelete ? (
                      <View style={styles.actions}>
                        <Text style={[styles.confirmText, { color: '#ef4444' }]}>
                          Ștergi definitiv?
                        </Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel="Anulează ștergerea"
                          onPress={() => setPendingDeleteId(null)}
                          style={[styles.smallBtn, { borderColor: theme.border }]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.smallBtnText, { color: theme.text }]}>Nu</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Șterge definitiv planul ${entry.name}`}
                          onPress={() => {
                            onDelete(entry.id);
                            setPendingDeleteId(null);
                          }}
                          style={[
                            styles.smallBtn,
                            { backgroundColor: '#ef4444', borderColor: '#ef4444' },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.smallBtnText, { color: '#ffffff' }]}>Șterge</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.actions}>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Șterge planul ${entry.name}`}
                          onPress={() => setPendingDeleteId(entry.id)}
                          style={[styles.smallBtn, { borderColor: theme.border }]}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.smallBtnText, { color: theme.textMuted }]}>
                            Șterge
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Reia planul ${entry.name}`}
                          onPress={() => {
                            onRestore(entry.id);
                            onClose();
                          }}
                          style={[
                            styles.smallBtn,
                            { backgroundColor: theme.primary, borderColor: theme.primary },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.smallBtnText, { color: theme.primaryText }]}>
                            Reia planul
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '86%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  title: { fontSize: 19, fontWeight: '900', letterSpacing: -0.4 },
  subtitle: { fontSize: 12, fontWeight: '500', marginTop: 3 },
  closeBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  closeBtnText: { fontSize: 18, fontWeight: '700' },
  saveRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 10 },
  saveBtnText: { fontSize: 13, fontWeight: '800' },
  list: { marginTop: 14 },
  empty: { fontSize: 13, fontWeight: '500', lineHeight: 20, paddingVertical: 24 },
  row: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  planName: { fontSize: 14, fontWeight: '800' },
  planMeta: { fontSize: 11, fontWeight: '500', marginTop: 3 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  confirmText: { flex: 1, fontSize: 11, fontWeight: '800' },
  smallBtn: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7 },
  smallBtnText: { fontSize: 11, fontWeight: '800' },
});
