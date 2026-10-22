import { Platform, StyleSheet, ViewStyle } from 'react-native';

/** Styles shared by the craving swiper and its cards. */
export const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
  },
  topControlRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeSegment: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 2,
    backgroundColor: 'rgba(128,128,128,0.1)',
  },
  segmentBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
  },
  counterBadge: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
  },
  quickActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    gap: 8,
    marginBottom: 10,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },

  /* Carousel Section */
  carouselSection: {
    width: '100%',
    alignItems: 'center',
  },
  carouselScrollView: {
    width: '100%',
  },
  carouselScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  carouselCardWrapper: {
    height: 335,
  },
  carouselCardInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  activeCardShadow: {
    ...Platform.select({
      web: {
        boxShadow: '0 10px 24px rgba(0,0,0,0.28)',
        userSelect: 'none',
      } as unknown as ViewStyle,
      default: {
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
      },
    }),
  },

  /* Card Body Elements */
  cardContent: {
    flex: 1,
    flexDirection: 'column',
  },
  cardMediaArea: {
    height: 105,
    width: '100%',
    position: 'relative',
    padding: 10,
  },
  cardTopRow: {
    height: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  vibePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  vibeIcon: {
    fontSize: 12,
  },
  vibeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  recipeCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  recipeCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerIconWrap: {
    position: 'absolute',
    top: 45,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  bigFoodIcon: {
    fontSize: 32,
    textAlign: 'center',
  },

  /* Details Area - Strict Vertical Constraints */
  cardDetailsArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    justifyContent: 'flex-start',
  },
  cardTitleBox: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardDescBox: {
    height: 34,
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  highlightsRow: {
    height: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    overflow: 'hidden',
  },
  highlightTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  highlightTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  sampleDishesBox: {
    height: 44,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'flex-start',
  },
  sampleDishesLabel: {
    height: 13,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  sampleDishesText: {
    height: 28,
    fontSize: 10.5,
    fontWeight: '500',
    lineHeight: 14,
  },
  cardSelectFooter: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    width: '100%',
  },
  toggleSelectPill: {
    width: '100%',
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleSelectText: {
    fontSize: 12,
  },

  /* Bottom Actions */
  bottomActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    width: '100%',
    maxWidth: 370,
  },
  actionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
  },
  nopeBtn: {
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderColor: 'rgba(255, 69, 58, 0.5)',
  },
  actionIconNope: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: '900',
  },
  actionLabelNope: {
    color: '#ff453a',
    fontSize: 13,
    fontWeight: '800',
  },
  likeBtn: {
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderColor: 'rgba(48, 209, 88, 0.6)',
  },
  actionIconLike: {
    fontSize: 15,
  },
  actionLabelLike: {
    color: '#30d158',
    fontSize: 13,
    fontWeight: '800',
  },
  actionBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionIconUndo: {
    fontSize: 16,
    fontWeight: '700',
  },
  actionIconNav: {
    fontSize: 18,
    fontWeight: '900',
  },
  deckStepHint: {
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },

  /* Grid View */
  gridSection: {
    width: '100%',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  gridCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: '48%',
    flexGrow: 1,
    minWidth: 260,
    gap: 12,
  },
  gridMoodIcon: {
    fontSize: 28,
  },
  gridTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    gap: 8,
  },
  gridMoodLabel: {
    fontSize: 14,
  },
  gridCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  gridCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  gridMoodDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  gridCheckPill: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Selected Pills Bar */
  selectedPillsContainer: {
    width: '100%',
    maxWidth: 580,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    minHeight: 56,
  },
  selectedPillsLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectedPillsEmptyText: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  activeMoodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  activeMoodPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeMoodPillRemove: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ff453a',
  },
});
