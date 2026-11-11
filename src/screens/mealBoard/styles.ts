import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
  },
  planHeaderWrapper: {
    width: '100%',
    marginBottom: 16,
  },
  mealsPerDayCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
  },
  toolbarControlsWrapper: {
    gap: 14,
  },
  toolbarDesktopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 18,
  },
  toolbarSection: {
    width: '100%',
  },
  // flex: 1 only where the sections sit side by side. Stacked on a phone, it gave each one a
  // basis of 0 on the web, so the card stopped growing with its content and the second row
  // of supermarkets hung out below it.
  toolbarSectionDesktop: {
    flex: 1,
    minWidth: 250,
  },
  toolbarDividerV: {
    width: 1,
    height: 48,
    marginHorizontal: 4,
  },
  mealsPerDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  mealsPerDayTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  mealsPerDaySubtitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  customizeDaysBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  customizeDaysBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentBtnActive: {
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
  },
  extrasPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  extraPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 5,
  },
  extraPillIcon: {
    fontSize: 13,
  },
  extraPillText: {
    fontSize: 11,
  },
  addDayExtraRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 14,
  },
  addDayExtraBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDayExtraText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feed: {
    width: '100%',
    gap: 24,
  },
  dayRowContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  dayGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  dayHeaderLeft: {
    gap: 4,
  },
  dayTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dayGroupTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dayCostBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dayGroupCost: {
    fontSize: 13,
    fontWeight: '800',
  },
  mealsCountTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  dayHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addDessertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  addDessertBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  dessertIncludedBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  dessertIncludedText: {
    fontSize: 12,
    fontWeight: '800',
  },
  mealsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    flexWrap: 'wrap',
    gap: 16,
    width: '100%',
  },
  // A column must not wrap: in a wrapping column each line is as wide as its content, so the
  // cards grew to their 460 px max on a 390 px phone and were cut off on the right.
  mealsRowMobile: {
    flexDirection: 'column',
    flexWrap: 'nowrap',
  },
  mealColMobile: {
    flexBasis: 'auto',
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    width: '100%',
  },
  mealCol: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 320,
    minWidth: 300,
    maxWidth: 460,
    transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickActionsBar: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 20,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  quickActionIcon: {
    fontSize: 22,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  quickActionSub: {
    fontSize: 11,
    marginTop: 1,
  },
});
