import { StyleSheet } from 'react-native';

/** Styles used by more than one step, or by a step and the wizard's frame. */
export const sharedStyles = StyleSheet.create({
  stepSection: {
    width: '100%',
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
    lineHeight: 22,
  },
  questionSubtitle: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  dayCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeSlotsHeading: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  stepImpactCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginTop: 14,
    marginBottom: 6,
    gap: 8,
  },
  stepImpactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepImpactIcon: {
    fontSize: 22,
  },
  stepImpactTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  stepImpactDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  stepImpactPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  stepImpactMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  stepImpactMiniPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
