import { SupermarketId } from '../types';

export interface StorePriceBenchmark {
  /** Price level relative to Lidl (1.00). Discounters sit below, urban convenience above. */
  multiplier: number;
  /** Share of the catalogue typically on promotion at any given time. */
  typicalPromoRate: number;
}

/**
 * Reference price positioning of Romanian retail chains, used to compare baskets between
 * stores. These are benchmarks, not live prices: the app never claims a current promotion
 * it cannot verify.
 */
export const STORE_PRICE_INDEX: Record<SupermarketId, StorePriceBenchmark> = {
  penny: { multiplier: 0.96, typicalPromoRate: 0.12 },
  kaufland: { multiplier: 0.98, typicalPromoRate: 0.1 },
  lidl: { multiplier: 1.0, typicalPromoRate: 0.08 },
  auchan: { multiplier: 1.02, typicalPromoRate: 0.09 },
  carrefour: { multiplier: 1.05, typicalPromoRate: 0.1 },
  profi: { multiplier: 1.08, typicalPromoRate: 0.07 },
  sezamo: { multiplier: 1.12, typicalPromoRate: 0.05 },
  mega_image: { multiplier: 1.15, typicalPromoRate: 0.08 },
};
