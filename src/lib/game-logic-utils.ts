
import type { Country, GlobalEvent, GlobalEventEffectProperty, SubRegion } from '@/types';

export function calculateGlobalAdoptionRate(currentCountries: Country[]): number {
  let totalPlayerAdoption = 0;
  let numReportingUnits = 0;
  currentCountries.forEach(country => {
    if (country.subRegions && country.subRegions.length > 0) {
      country.subRegions.forEach(sr => {
        totalPlayerAdoption += sr.adoptionLevel;
        numReportingUnits++;
      });
    } else {
      totalPlayerAdoption += country.adoptionLevel;
      numReportingUnits++;
    }
  });
  return numReportingUnits > 0 ? totalPlayerAdoption / numReportingUnits : 0;
}

export function calculateRivalGlobalInfluence(rivalId: string, currentCountries: Country[]): number {
  let totalRivalInfluence = 0;
  let numReportingUnits = 0;
  currentCountries.forEach(country => {
    if (country.subRegions && country.subRegions.length > 0) {
      country.subRegions.forEach(sr => {
        const rivalData = sr.rivalPresences.find(rp => rp.rivalId === rivalId);
        if (rivalData) {
          totalRivalInfluence += rivalData.influenceLevel;
        }
        numReportingUnits++;
      });
    } else {
      const rivalData = country.rivalPresences.find(rp => rp.rivalId === rivalId);
      if (rivalData) {
        totalRivalInfluence += rivalData.influenceLevel;
      }
      numReportingUnits++;
    }
  });
  return numReportingUnits > 0 ? totalRivalInfluence / numReportingUnits : 0;
}

export function getCountryModifiers(
  countryId: string,
  subRegionId: string | undefined,
  currentActiveEventsList: GlobalEvent[],
  allCountries: Country[] // Added to find parent country if needed
): Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> {
  const modifiers: Record<GlobalEventEffectProperty, { additive: number, multiplicative: number }> = {
    culturalOpenness: { additive: 0, multiplicative: 1 },
    economicDevelopment: { additive: 0, multiplicative: 1 },
    resistanceLevel: { additive: 0, multiplicative: 1 },
    adoptionRateModifier: { additive: 0, multiplicative: 1 },
    ipBonus: { additive: 0, multiplicative: 1 }, // Though ipBonus is usually global, handled separately for direct IP add.
  };

  const parentCountry = allCountries.find(c => c.id === countryId);

  currentActiveEventsList.forEach(event => {
    event.effects.forEach(effect => {
      let applies = false;
      if (effect.targetType === 'global') {
        applies = true;
      } else if (effect.targetType === 'country' && effect.countryId === countryId) {
        // This effect applies to the country, and thus to its subregions unless a subregion-specific effect overrides
        applies = true;
      } else if (effect.targetType === 'subregion' && effect.countryId === countryId && effect.subRegionId === subRegionId) {
        // This effect applies specifically to this subregion
        applies = true;
      }

      if (applies) {
        const prop = effect.property as GlobalEventEffectProperty;
        if (modifiers[prop]) {
          if (effect.isMultiplier) {
            modifiers[prop]!.multiplicative *= effect.value;
          } else {
            modifiers[prop]!.additive += effect.value;
          }
        } else {
          console.warn(`Modifier for property '${prop}' not found in getCountryModifiers. This may be an issue if it's not 'ipBonus'.`);
        }
      }
    });
  });
  return modifiers;
}

// Helper to get a deep copy of a country or subregion for safe modifications
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Helper to safely access sub-region specific stats, falling back to parent country
export function getRegionStat(
  region: SubRegion | Country,
  parentCountry: Country | undefined,
  statName: keyof Pick<SubRegion, 'internetPenetration' | 'educationLevel' | 'mediaFreedom' | 'culturalOpenness' | 'economicDevelopment'>,
  defaultValue: number = 0.5
): number {
  if ('subRegions' in region) { // It's a Country object without subRegions for this context
    return (region as Country)[statName as keyof Country] ?? defaultValue;
  }
  // It's a SubRegion
  const subRegion = region as SubRegion;
  return subRegion[statName] ?? parentCountry?.[statName as keyof Country] ?? defaultValue;
}
