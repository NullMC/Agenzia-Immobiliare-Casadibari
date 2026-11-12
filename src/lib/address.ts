/** Street ("Via Pasubio") and house number ("78A") are stored separately. */
export function formatStreetAddress(property: {
  address?: string | null;
  street_number?: string | null;
}): string {
  return [property.address?.trim(), property.street_number?.trim()].filter(Boolean).join(' ');
}

const TRAILING_NUMBER =
  /^(.*?)[\s,]+(?:n\.?\s*)?(\d+\s*[a-z]?(?:\s*\/\s*[a-z0-9]+)?)\s*$/i;

/** Split a legacy one-field address ("Via Isonzo 125") into street and number. */
export function splitStreetAddress(value: string): { street: string; number: string } {
  const match = value.trim().match(TRAILING_NUMBER);
  if (!match) return { street: value.trim(), number: '' };
  return {
    street: match[1].replace(/[\s,]+$/, ''),
    number: match[2].replace(/\s+/g, '').toUpperCase(),
  };
}
