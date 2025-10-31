/**
 * Filters affiliate links by user locale preference
 * Priority: exact locale match > country match > first available link
 */
export function getLocalizedAffiliateLink(
  links: Array<{ url: string; locale?: string | null; store?: string | null }>,
  userLocale: 'en-US' | 'pt-BR'
): string {
  if (!links || links.length === 0) return '#';

  // Normalize locale to country code
  const userCountry = userLocale === 'pt-BR' ? 'br' : 'us';

  // 1. Try exact locale match (en-us or pt-br)
  const exactMatch = links.find(
    (link) => link.locale?.toLowerCase() === userLocale.toLowerCase().replace('-', '')
  );
  if (exactMatch?.url) return exactMatch.url;

  // 2. Try country match in locale field
  const countryMatch = links.find((link) =>
    link.locale?.toLowerCase().includes(userCountry)
  );
  if (countryMatch?.url) return countryMatch.url;

  // 3. Try store name match (Amazon BR, Amazon US, etc.)
  const storeMatch = links.find((link) => {
    const store = link.store?.toLowerCase() || '';
    return userCountry === 'br' ? store.includes('br') : store.includes('us');
  });
  if (storeMatch?.url) return storeMatch.url;

  // 4. Fallback to first available link
  return links[0]?.url || '#';
}

/**
 * Gets all links for a specific locale
 */
export function getLinksForLocale(
  links: Array<{ url: string; locale?: string | null; store?: string | null }>,
  userLocale: 'en-US' | 'pt-BR'
): Array<{ url: string; locale?: string | null; store?: string | null }> {
  if (!links || links.length === 0) return [];

  const userCountry = userLocale === 'pt-BR' ? 'br' : 'us';

  return links.filter((link) => {
    const locale = link.locale?.toLowerCase() || '';
    const store = link.store?.toLowerCase() || '';
    return locale.includes(userCountry) || store.includes(userCountry);
  });
}

/**
 * Formats store name based on locale
 */
export function formatStoreName(store: string | undefined, userLocale: 'en-US' | 'pt-BR'): string {
  if (!store) return userLocale === 'pt-BR' ? 'Loja' : 'Store';
  
  // Parse JSON store if it's stringified
  try {
    const parsed = JSON.parse(store);
    if (parsed && typeof parsed === 'object' && parsed.store) {
      return parsed.store;
    }
  } catch {
    // Not JSON, use as-is
  }

  return store;
}
