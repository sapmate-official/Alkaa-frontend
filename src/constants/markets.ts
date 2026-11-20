export const PREDEFINED_MARKETS = [
  'Technology & Software',
  'Healthcare & Pharmaceuticals',
  'Financial Services & Banking',
  'E-Commerce & Retail',
  'Manufacturing & Industrial',
  'Education & EdTech',
  'Telecommunications',
  'Media, Advertising & Entertainment',
  'Logistics, Transportation & Supply Chain',
  'Energy, Oil, Gas & Utilities',
  'Real Estate & Construction',
  'Consulting & Professional Services',
  'Hospitality, Travel & Tourism',
  'Automotive & Aerospace',
  'Agriculture & Food Processing',
  'Government & Public Sector',
  'Non-Profit & NGO',
  'Other'
] as const;

export const OTHER_MARKET_KEY = 'Other';

/**
 * Returns whether a given market string belongs to the predefined options list (excluding 'Other').
 */
export const isKnownPredefinedMarket = (val?: string | null): boolean => {
  if (!val) return false;
  const trimmed = val.trim();
  return (PREDEFINED_MARKETS as readonly string[]).includes(trimmed) && trimmed !== OTHER_MARKET_KEY;
};

/**
 * Resolves the initial select dropdown value and custom text value given an existing market string.
 */
export const resolveMarketSelection = (
  market?: string | null
): { selectValue: string; customValue: string } => {
  if (!market || !market.trim()) {
    return { selectValue: '', customValue: '' };
  }
  const trimmed = market.trim();
  if (isKnownPredefinedMarket(trimmed)) {
    return { selectValue: trimmed, customValue: '' };
  }
  if (trimmed === OTHER_MARKET_KEY) {
    return { selectValue: OTHER_MARKET_KEY, customValue: '' };
  }
  return { selectValue: OTHER_MARKET_KEY, customValue: trimmed };
};
