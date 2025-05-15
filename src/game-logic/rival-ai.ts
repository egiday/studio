
'use client';

import type { Country, SubRegion, RivalMovement, AIPersonalityType, RivalPresence } from '@/types';
import type { RIVAL_MOVEMENTS as AllRivalMovementsType } from '@/config/gameData';
import * as GameConstants from '@/config/gameConstants';
import { deepClone, getRegionStat } from '@/lib/game-logic-utils';

interface ProcessRivalTurnsParams {
  rivalMovementsState: RivalMovement[];
  countriesState: Country[];
  currentMovementName: string;
  initialRivalMovementsData: typeof AllRivalMovementsType; // For static rival data like names if needed for logging
  addRecentEventEntry: (entry: string) => void;
}

interface ProcessRivalTurnsResult {
  updatedCountries: Country[];
  // recentEventsSummaryUpdate: string; // The main hook will now manage the summary directly
}

function applyRivalSpreadToRegion(
  region: SubRegion | Country,
  isSubRegion: boolean,
  parentCountryForSR: Country | undefined,
  rival: RivalMovement,
  currentMovementName: string,
  addRecentEventEntry: (entry: string) => void
): SubRegion | Country {
  let modRegion: SubRegion | Country = deepClone(region);
  const parentCountry = isSubRegion ? parentCountryForSR! : modRegion as Country;
  const regionCulturalOpenness = getRegionStat(modRegion, parentCountry, 'culturalOpenness');
  const regionPlayerAdoption = modRegion.adoptionLevel;

  let rivalDataForRegion = modRegion.rivalPresences.find(rp => rp.rivalId === rival.id);
  let currentRivalInfluence = rivalDataForRegion ? rivalDataForRegion.influenceLevel : 0;
  let actualRivalGainThisTurn = 0;

  let potentialRivalGain = 0;
  let baseGain = 0;
  let opennessFactor = 1;
  let playerPresencePenaltyFactor = 1;

  switch (rival.personality) {
    case 'AggressiveExpansionist':
      baseGain = (0.022 + Math.random() * 0.038) * rival.aggressiveness;
      opennessFactor = (1 - regionCulturalOpenness * 0.35);
      playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.5));
      break;
    case 'CautiousConsolidator':
      if (currentRivalInfluence > 0) {
        baseGain = (0.025 + Math.random() * 0.028) * rival.aggressiveness;
        opennessFactor = (1 - regionCulturalOpenness * 0.55);
        playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.7));
      }
      break;
    case 'OpportunisticInfiltrator': {
      const totalOtherInfluence = regionPlayerAdoption + modRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((s, rp) => s + rp.influenceLevel, 0);
      if (totalOtherInfluence > 0.2 && totalOtherInfluence < 0.8) {
        baseGain = (0.015 + Math.random() * 0.025) * rival.aggressiveness;
        opennessFactor = (1 - regionCulturalOpenness * 0.25);
        playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.2));
      }
      break;
    }
    case 'IsolationistDefender': {
      const isHomeCountry = parentCountry.id === rival.startingCountryId;
      if (isHomeCountry) {
        baseGain = (0.03 + Math.random() * 0.03) * rival.aggressiveness;
        opennessFactor = (1 - regionCulturalOpenness * 0.1);
        playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.1));
      }
      break;
    }
    case 'ZealousPurifier':
      baseGain = (0.028 + Math.random() * 0.04) * rival.aggressiveness;
      opennessFactor = (1 - regionCulturalOpenness * 0.3);
      playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.2));
      break;
  }
  potentialRivalGain = baseGain * opennessFactor * playerPresencePenaltyFactor;
  potentialRivalGain = Math.max(0, potentialRivalGain);

  if (potentialRivalGain > 0) {
    let otherRivalsTotalInfluence = modRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((sum, rp) => sum + rp.influenceLevel, 0);
    let totalOccupiedByPlayerAndOtherRivals = regionPlayerAdoption + otherRivalsTotalInfluence;
    let totalOccupiedSpace = currentRivalInfluence + totalOccupiedByPlayerAndOtherRivals;
    const emptySpace = Math.max(0, 1.0 - totalOccupiedSpace);

    const gainFromEmptySpace = Math.min(potentialRivalGain, emptySpace);
    actualRivalGainThisTurn += gainFromEmptySpace;

    let remainingGainForRival = potentialRivalGain - gainFromEmptySpace;
    const totalInfluenceToTakeFrom = regionPlayerAdoption + otherRivalsTotalInfluence;

    if (remainingGainForRival > 0 && totalInfluenceToTakeFrom > 0) {
      const influenceTakenThisTurn = Math.min(remainingGainForRival, totalInfluenceToTakeFrom);
      actualRivalGainThisTurn += influenceTakenThisTurn;

      if (regionPlayerAdoption > 0) {
        const playerProportion = totalInfluenceToTakeFrom > 0 ? regionPlayerAdoption / totalInfluenceToTakeFrom : 0;
        modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - (playerProportion * influenceTakenThisTurn));
      }

      modRegion.rivalPresences = modRegion.rivalPresences.map(rp => {
        if (rp.rivalId === rival.id) return rp;
        if (otherRivalsTotalInfluence > 0) {
          const otherRivalProportion = totalInfluenceToTakeFrom > 0 ? rp.influenceLevel / totalInfluenceToTakeFrom : 0;
          const reductionFromOtherRival = otherRivalProportion * influenceTakenThisTurn;
          return { ...rp, influenceLevel: Math.max(0, rp.influenceLevel - reductionFromOtherRival) };
        }
        return rp;
      }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id);
    }
    currentRivalInfluence = Math.min(1, currentRivalInfluence + actualRivalGainThisTurn);
  }

  const rivalIdx = modRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
  if (rivalIdx !== -1) {
    modRegion.rivalPresences[rivalIdx].influenceLevel = currentRivalInfluence;
  } else if (currentRivalInfluence > 0.001) {
    modRegion.rivalPresences.push({ rivalId: rival.id, influenceLevel: currentRivalInfluence });
  }
  modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
  modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel); // Ensure player adoption is not negative

  if (actualRivalGainThisTurn > 0.001) {
    if ((!rivalDataForRegion || rivalDataForRegion.influenceLevel === 0) && currentRivalInfluence > 0) {
      addRecentEventEntry(` ${rival.name} establishes a presence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`);
    } else if (rivalDataForRegion && currentRivalInfluence > rivalDataForRegion.influenceLevel && currentRivalInfluence > 0.05 && rivalDataForRegion.influenceLevel <= 0.05) {
      addRecentEventEntry(` ${rival.name} strengthens its influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`);
    }
  }

  // Personality-specific resistance/suppression effects
  if (rival.personality === 'CautiousConsolidator' && currentRivalInfluence > 0.5 && modRegion.adoptionLevel > 0.05 && Math.random() < (GameConstants.RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness)) {
    const prevResistance = modRegion.resistanceLevel;
    modRegion.resistanceLevel = Math.min(0.95, modRegion.resistanceLevel + GameConstants.RIVAL_COUNTER_RESISTANCE_AMOUNT);
    if (modRegion.resistanceLevel > prevResistance + 0.001) {
      addRecentEventEntry(` ${rival.name} stirs dissent against ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`);
    }
  } else if (rival.personality === 'ZealousPurifier' && currentRivalInfluence > 0.3) {
    if (modRegion.adoptionLevel > 0.01 && Math.random() < 0.3 * rival.aggressiveness) {
      const reduction = Math.min(modRegion.adoptionLevel, 0.02 + Math.random() * 0.03);
      modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel - reduction);
      addRecentEventEntry(` ${rival.name} actively suppresses ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}, reducing its influence.`);
    }
    modRegion.rivalPresences.forEach(otherRivalPresence => {
      if (otherRivalPresence.rivalId !== rival.id && otherRivalPresence.influenceLevel > 0.01 && Math.random() < 0.2 * rival.aggressiveness) {
        const reduction = Math.min(otherRivalPresence.influenceLevel, 0.02 + Math.random() * 0.02);
        otherRivalPresence.influenceLevel = Math.max(0, otherRivalPresence.influenceLevel - reduction);
        // Assuming initialRivalMovementsData is accessible for names or passed if needed for logging
        // For now, skipping precise name logging for suppressed other rivals to avoid passing more config down
        addRecentEventEntry(` ${rival.name} purges other influences in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`);
      }
    });
    modRegion.rivalPresences = modRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
  } else if (rival.personality === 'IsolationistDefender' && parentCountry.id === rival.startingCountryId && modRegion.adoptionLevel > 0.05 && Math.random() < (0.4 * rival.aggressiveness)) {
    const prevResistance = modRegion.resistanceLevel;
    modRegion.resistanceLevel = Math.min(0.98, modRegion.resistanceLevel + (GameConstants.RIVAL_COUNTER_RESISTANCE_AMOUNT * 1.5));
    if (modRegion.resistanceLevel > prevResistance + 0.001) {
      addRecentEventEntry(` ${rival.name} fiercely defends ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''} against ${currentMovementName}.`);
    }
  }
  modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel);
  return modRegion;
}


export function processRivalTurns({
  rivalMovementsState,
  countriesState,
  currentMovementName,
  initialRivalMovementsData, // Used for logging other rival names if needed
  addRecentEventEntry,
}: ProcessRivalTurnsParams): ProcessRivalTurnsResult {
  let countriesAfterRivalTurns: Country[] = deepClone(countriesState);

  rivalMovementsState.forEach(rival => {
    countriesAfterRivalTurns = countriesAfterRivalTurns.map(country => {
      let modCountryForRival: Country = deepClone(country);
      if (modCountryForRival.subRegions && modCountryForRival.subRegions.length > 0) {
        modCountryForRival.subRegions = modCountryForRival.subRegions.map(sr => applyRivalSpreadToRegion(sr, true, modCountryForRival, rival, currentMovementName, addRecentEventEntry) as SubRegion);
      } else {
        modCountryForRival = applyRivalSpreadToRegion(modCountryForRival, false, undefined, rival, currentMovementName, addRecentEventEntry) as Country;
      }
      return modCountryForRival;
    });

    // Inter-country Spread for Rivals
    let attemptNewCountrySpread = false;
    let newCountrySpreadChance = 0;
    let newCountryInitialInfluence = 0;
    let spreadAggressivenessFactor = rival.aggressiveness;

    switch (rival.personality) {
      case 'AggressiveExpansionist': {
        const hasStrongPresenceSomewhere = countriesAfterRivalTurns.some(c =>
          (c.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > GameConstants.RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD)) ||
          (c.subRegions && c.subRegions.some(sr => sr.rivalPresences.some(rp => rp.rivalId === rival.id && rp.influenceLevel > GameConstants.RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD)))
        );
        if (hasStrongPresenceSomewhere) {
          attemptNewCountrySpread = true;
          newCountrySpreadChance = GameConstants.RIVAL_AGGRESSIVE_SPREAD_NEW_COUNTRY_CHANCE + spreadAggressivenessFactor * 0.02;
          newCountryInitialInfluence = GameConstants.RIVAL_AGGRESSIVE_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT + Math.random() * 0.01;
        }
        break;
      }
      case 'CautiousConsolidator': {
        const dominatesACountry = countriesAfterRivalTurns.some(c => {
          let countryTotalRivalInfluence = 0;
          let countryTotalUnits = 0;
          if (c.subRegions && c.subRegions.length > 0) {
            c.subRegions.forEach(sr => {
              const rData = sr.rivalPresences.find(rp => rp.rivalId === rival.id);
              if (rData) countryTotalRivalInfluence += rData.influenceLevel;
              countryTotalUnits++;
            });
          } else {
            const rData = c.rivalPresences.find(rp => rp.rivalId === rival.id);
            if (rData) countryTotalRivalInfluence += rData.influenceLevel;
            countryTotalUnits++;
          }
          return countryTotalUnits > 0 && (countryTotalRivalInfluence / countryTotalUnits) > GameConstants.RIVAL_CAUTIOUS_MIN_COUNTRY_DOMINANCE_FOR_NEW_COUNTRY_SPREAD;
        });
        if (dominatesACountry) {
          attemptNewCountrySpread = true;
          newCountrySpreadChance = GameConstants.RIVAL_CAUTIOUS_SPREAD_NEW_COUNTRY_CHANCE + spreadAggressivenessFactor * 0.005;
          newCountryInitialInfluence = GameConstants.RIVAL_CAUTIOUS_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT + Math.random() * 0.005;
        }
        break;
      }
      case 'OpportunisticInfiltrator':
        attemptNewCountrySpread = true;
        newCountrySpreadChance = 0.01 + spreadAggressivenessFactor * 0.015;
        newCountryInitialInfluence = 0.008 + Math.random() * 0.007;
        break;
      case 'ZealousPurifier':
        attemptNewCountrySpread = true;
        newCountrySpreadChance = 0.012 + spreadAggressivenessFactor * 0.018;
        newCountryInitialInfluence = 0.01 + Math.random() * 0.01;
        break;
      case 'IsolationistDefender':
        if (Math.random() < 0.001 * spreadAggressivenessFactor) {
          attemptNewCountrySpread = true;
          newCountrySpreadChance = 0.001 * spreadAggressivenessFactor;
          newCountryInitialInfluence = 0.001 + Math.random() * 0.002;
        }
        break;
    }

    if (attemptNewCountrySpread && Math.random() < newCountrySpreadChance) {
      const uninfluencedOrWeaklyInfluencedCountries = countriesAfterRivalTurns.filter(uc => {
        let rivalPresenceInTargetCountry = 0;
        if (uc.subRegions && uc.subRegions.length > 0) {
          rivalPresenceInTargetCountry = uc.subRegions.reduce((sum, sr) => sum + (sr.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0), 0) / uc.subRegions.length;
        } else {
          rivalPresenceInTargetCountry = uc.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0;
        }
        return rivalPresenceInTargetCountry < 0.001;
      });

      if (uninfluencedOrWeaklyInfluencedCountries.length > 0) {
        let targetCountryToModify: Country | undefined = deepClone(uninfluencedOrWeaklyInfluencedCountries[Math.floor(Math.random() * uninfluencedOrWeaklyInfluencedCountries.length)]);
        if (targetCountryToModify) {
          let targetSpreadRegion: SubRegion | Country;
          let isTargetSubRegion = false;
          if (targetCountryToModify.subRegions && targetCountryToModify.subRegions.length > 0) {
            const randomSubRegionIndex = Math.floor(Math.random() * targetCountryToModify.subRegions.length);
            targetSpreadRegion = targetCountryToModify.subRegions[randomSubRegionIndex];
            isTargetSubRegion = true;
          } else {
            targetSpreadRegion = targetCountryToModify;
          }

          let currentRivalInfluenceInTarget = targetSpreadRegion.rivalPresences.find(rp => rp.rivalId === rival.id)?.influenceLevel || 0;
          let playerAdoptionInTarget = targetSpreadRegion.adoptionLevel;
          let otherRivalsTotalInTarget = targetSpreadRegion.rivalPresences.filter(rp => rp.rivalId !== rival.id).reduce((s, rp) => s + rp.influenceLevel, 0);
          let actualInitialGainForNewCountry = 0;

          const totalSpaceOccupiedByOthersAndPlayer = playerAdoptionInTarget + otherRivalsTotalInTarget + currentRivalInfluenceInTarget;
          const emptySpace = Math.max(0, 1.0 - totalSpaceOccupiedByOthersAndPlayer);
          actualInitialGainForNewCountry = Math.min(newCountryInitialInfluence, emptySpace);

          let remainingGain = newCountryInitialInfluence - actualInitialGainForNewCountry;
          const totalInfluenceToTakeFrom = playerAdoptionInTarget + otherRivalsTotalInTarget;

          if (remainingGain > 0 && totalInfluenceToTakeFrom > 0) {
            const influenceTaken = Math.min(remainingGain, totalInfluenceToTakeFrom);
            actualInitialGainForNewCountry += influenceTaken;
            if (playerAdoptionInTarget > 0) {
              const playerProportion = totalInfluenceToTakeFrom > 0 ? playerAdoptionInTarget / totalInfluenceToTakeFrom : 0;
              targetSpreadRegion.adoptionLevel = Math.max(0, playerAdoptionInTarget - (playerProportion * influenceTaken));
            }
            targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.map(orp => {
              if (orp.rivalId === rival.id) return orp;
              if (otherRivalsTotalInTarget > 0) {
                const otherRivalProp = totalInfluenceToTakeFrom > 0 ? orp.influenceLevel / totalInfluenceToTakeFrom : 0;
                return { ...orp, influenceLevel: Math.max(0, orp.influenceLevel - (otherRivalProp * influenceTaken)) };
              }
              return orp;
            }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === rival.id);
          }

          const rivalIdxNew = targetSpreadRegion.rivalPresences.findIndex(rp => rp.rivalId === rival.id);
          if (rivalIdxNew !== -1) {
            targetSpreadRegion.rivalPresences[rivalIdxNew].influenceLevel = Math.min(1, (targetSpreadRegion.rivalPresences[rivalIdxNew].influenceLevel || 0) + actualInitialGainForNewCountry);
          } else if (actualInitialGainForNewCountry > 0.001) {
            targetSpreadRegion.rivalPresences.push({ rivalId: rival.id, influenceLevel: actualInitialGainForNewCountry });
          }
          targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
          targetSpreadRegion.adoptionLevel = Math.max(0, targetSpreadRegion.adoptionLevel);


          if (actualInitialGainForNewCountry > 0.001) {
            if (isTargetSubRegion && targetCountryToModify.subRegions) {
              targetCountryToModify.subRegions = targetCountryToModify.subRegions.map(sr => sr.id === (targetSpreadRegion as SubRegion).id ? targetSpreadRegion as SubRegion : sr);
            } else {
              targetCountryToModify = targetSpreadRegion as Country;
            }
            countriesAfterRivalTurns = countriesAfterRivalTurns.map(c => c.id === targetCountryToModify!.id ? targetCountryToModify! : c);
            addRecentEventEntry(` ${rival.name} expands its influence into ${targetSpreadRegion.name}${isTargetSubRegion ? ` in ${targetCountryToModify.name}` : ''}.`);
          }
        }
      }
    }
  });

  return {
    updatedCountries: countriesAfterRivalTurns,
    // recentEventsSummaryUpdate: tempRecentEventsSummary, // Managed by addRecentEventEntry directly
  };
}
