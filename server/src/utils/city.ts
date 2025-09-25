const DEFAULT_CITIES = [
  'Douala',
  'Yaoundé',
  'Bafoussam',
  'Garoua',
  'Maroua',
  'Bertoua',
  'Kribi',
  'Buea',
  'Limbe',
  'Ebolowa',
  'Ngaoundéré',
  'Bafia',
  'Dschang'
];

export const extractCity = (address1: string, customCities: string[] = DEFAULT_CITIES): string | undefined => {
  if (!address1) {
    return undefined;
  }
  const segments = address1
    .split(/[;,]/)
    .map((segment) => segment.trim())
    .filter(Boolean);

  for (const segment of segments) {
    const match = customCities.find(
      (city) => city.toLowerCase() === segment.toLowerCase() || segment.toLowerCase().includes(city.toLowerCase())
    );
    if (match) {
      return match;
    }
  }

  const lastSegment = segments.at(-1);
  return lastSegment && lastSegment.length > 2 ? lastSegment : undefined;
};

export const loadCustomCities = (override?: string[]): string[] => {
  if (!override || !override.length) {
    return DEFAULT_CITIES;
  }
  return Array.from(new Set([...override, ...DEFAULT_CITIES]));
};
