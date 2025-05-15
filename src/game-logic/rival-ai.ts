
'use client';

import type { Country, SubRegion, RivalMovement, EvolutionItem, RivalPresence } from '@/types';
import type { RIVAL_MOVEMENTS as AllRivalMovementsType, EVOLUTION_ITEMS as AllEvolutionItemsType } from '@/config/gameData';
import * as GameConstants from '@/config/gameConstants';
import { deepClone, getRegionStat, calculateRivalGlobalInfluence } from '@/lib/game-logic-utils';

interface ProcessRivalTurnsParams {
  rivalMovementsState: RivalMovement[];
  countriesState: Country[];
  currentMovementName: string; // Player's movement name for logging context
  allEvolutionItems: typeof AllEvolutionItemsType; // For AI evolution choices
  addRecentEventEntry: (entry: string) => void;
}

interface ProcessRivalTurnsResult {
  updatedCountries: Country[];
  updatedRivalMovements: RivalMovement[];
}

function applyRivalSpreadToRegion(
  region: SubRegion | Country,
  isSubRegion: boolean,
  parentCountryForSR: Country | undefined,
  rival: RivalMovement,
  currentMovementName: string, // Player's movement name
  addRecentEventEntry: (entry: string) => void,
  newRecentEventsSummary: string // Pass and return summary to avoid direct side-effects in this pure-like function
): { updatedRegion: SubRegion | Country; eventsSummaryUpdate: string } {
  let modRegion: SubRegion | Country = deepClone(region);
  let eventsSummaryUpdate = '';
  const parentCountry = isSubRegion ? parentCountryForSR! : modRegion as Country;
  const regionCulturalOpenness = getRegionStat(modRegion, parentCountry, 'culturalOpenness');
  const regionPlayerAdoption = modRegion.adoptionLevel;

  let rivalDataForRegion = modRegion.rivalPresences.find(rp => rp.rivalId === rival.id);
  let currentRivalInfluence = rivalDataForRegion ? rivalDataForRegion.influenceLevel : 0;
  
  let potentialRivalGain = 0;
  let baseGain = 0;
  let opennessFactor = 1;
  let playerPresencePenaltyFactor = 1;
  let actualRivalGainThisTurn = 0; // Initialize here

  switch (rival.personality) {
    case 'AggressiveExpansionist':
      baseGain = (0.025 + Math.random() * 0.04) * rival.aggressiveness;
      opennessFactor = (1 - regionCulturalOpenness * 0.35); // Less penalty from openness
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
        baseGain = (0.018 + Math.random() * 0.028) * rival.aggressiveness;
        opennessFactor = (1 - regionCulturalOpenness * 0.25); // Less penalty from openness
        playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.2));
      }
      break;
    }
    case 'IsolationistDefender': {
      const isHomeCountry = parentCountry.id === rival.startingCountryId;
      if (isHomeCountry) {
        baseGain = (0.035 + Math.random() * 0.035) * rival.aggressiveness; 
        opennessFactor = (1 - regionCulturalOpenness * 0.1); // Minimal penalty from openness in home turf
        playerPresencePenaltyFactor = (1 - (regionPlayerAdoption * GameConstants.PLAYER_SPREAD_PENALTY_ON_RIVAL * 0.1));
      }
      break;
    }
    case 'ZealousPurifier':
      baseGain = (0.03 + Math.random() * 0.042) * rival.aggressiveness; 
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
  modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel); 

  if (actualRivalGainThisTurn > 0.001) {
    const prevInfluence = rivalDataForRegion ? rivalDataForRegion.influenceLevel : 0;
    if ((!rivalDataForRegion || prevInfluence === 0) && currentRivalInfluence > 0) {
      eventsSummaryUpdate += ` ${rival.name} establishes a presence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
    } else if (currentRivalInfluence > prevInfluence && currentRivalInfluence > 0.05 && prevInfluence <= 0.05) { 
      eventsSummaryUpdate += ` ${rival.name} strengthens its influence in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
    }
  }

  if ( (rival.personality === 'CautiousConsolidator' || rival.personality === 'IsolationistDefender') && 
       currentRivalInfluence > 0.5 && modRegion.adoptionLevel > 0.05 && 
       Math.random() < (GameConstants.RIVAL_COUNTER_RESISTANCE_CHANCE * rival.aggressiveness * (rival.personality === 'IsolationistDefender' ? 1.2 : 1)) ) {
    const prevResistance = modRegion.resistanceLevel;
    const resistanceIncrease = GameConstants.RIVAL_COUNTER_RESISTANCE_AMOUNT * (rival.personality === 'IsolationistDefender' ? 2.0 : 1.0);
    modRegion.resistanceLevel = Math.min( (rival.personality === 'IsolationistDefender' ? 0.98 : 0.95), modRegion.resistanceLevel + resistanceIncrease);
    if (modRegion.resistanceLevel > prevResistance + 0.001) {
      eventsSummaryUpdate += ` ${rival.name} ${rival.personality === 'IsolationistDefender' ? 'fiercely defends' : 'stirs dissent against'} ${currentMovementName} in ${modRegion.name}${isSubRegion ? ` in ${parentCountry.name}` : ''}.`;
    }
  }
  modRegion.adoptionLevel = Math.max(0, modRegion.adoptionLevel);
  return { updatedRegion: modRegion, eventsSummaryUpdate };
}


export function processRivalTurns({
  rivalMovementsState,
  countriesState,
  currentMovementName,
  allEvolutionItems,
  addRecentEventEntry,
}: ProcessRivalTurnsParams): ProcessRivalTurnsResult {
  let countriesAfterRivalTurns: Country[] = deepClone(countriesState);
  let accumulatedEventSummary = "";
  
  const finalUpdatedRivals = rivalMovementsState.map(originalRival => {
    // Correctly clone the rival, ensuring icon and evolvedItemIds are preserved/reconstructed
    const { evolvedItemIds, icon, ...serializableRest } = originalRival;
    let currentRival: RivalMovement = {
      ...deepClone(serializableRest), // Deep clone only truly serializable properties
      icon: icon, // Preserve the original icon function
      evolvedItemIds: new Set(evolvedItemIds), // Reconstruct Set
    };

    // 1. IP Generation for the rival
    const rivalGlobalInfluence = calculateRivalGlobalInfluence(currentRival.id, countriesState); // Use original countriesState for IP calc
    const ipEarnedThisTurn = Math.floor(GameConstants.RIVAL_BASE_IP_PER_TURN + (rivalGlobalInfluence * 100 * GameConstants.RIVAL_IP_PER_GLOBAL_INFLUENCE_POINT));
    currentRival.influencePoints += ipEarnedThisTurn;
    
    // 2. Evolution Attempt for the rival
    const availableEvolutions = allEvolutionItems.filter(item => {
        const notEvolved = !currentRival.evolvedItemIds.has(item.id);
        const prereqsMet = !item.prerequisites || item.prerequisites.every(prereqId => currentRival.evolvedItemIds.has(prereqId));
        return notEvolved && prereqsMet;
    });

    const affordableEvolutions = availableEvolutions.filter(item => item.cost <= currentRival.influencePoints);

    if (affordableEvolutions.length > 0) {
        affordableEvolutions.sort((a, b) => a.cost - b.cost); // Sort by cost
        // Find all evolutions with the minimum cost
        const cheapestCost = affordableEvolutions[0].cost;
        const cheapestOptions = affordableEvolutions.filter(item => item.cost === cheapestCost);
        // Randomly select one from the cheapest options
        const chosenEvolution = cheapestOptions[Math.floor(Math.random() * cheapestOptions.length)];
        
        currentRival.influencePoints -= chosenEvolution.cost;
        currentRival.evolvedItemIds.add(chosenEvolution.id);
        accumulatedEventSummary += ` ${currentRival.name} has evolved: ${chosenEvolution.name}!`;
    }

    // 3. Rival Spread Logic (intra-region)
    countriesAfterRivalTurns = countriesAfterRivalTurns.map(country => {
      let modCountryForRival: Country = deepClone(country);
      let countryEventSummary = "";
      if (modCountryForRival.subRegions && modCountryForRival.subRegions.length > 0) {
        modCountryForRival.subRegions = modCountryForRival.subRegions.map(sr => {
          const result = applyRivalSpreadToRegion(sr, true, modCountryForRival, currentRival, currentMovementName, addRecentEventEntry, countryEventSummary);
          countryEventSummary += result.eventsSummaryUpdate;
          return result.updatedRegion as SubRegion;
        });
      } else {
        const result = applyRivalSpreadToRegion(modCountryForRival, false, undefined, currentRival, currentMovementName, addRecentEventEntry, countryEventSummary);
        countryEventSummary += result.eventsSummaryUpdate;
        modCountryForRival = result.updatedRegion as Country;
      }
      accumulatedEventSummary += countryEventSummary;
      return modCountryForRival;
    });

    // 4. Inter-country Spread for the currentRival
    let attemptNewCountrySpread = false;
    let newCountrySpreadChance = 0;
    let newCountryInitialInfluence = 0;
    let spreadAggressivenessFactor = currentRival.aggressiveness;
    let localEventSummaryForInterCountrySpread = "";


    switch (currentRival.personality) {
      case 'AggressiveExpansionist': {
        const hasStrongPresenceSomewhere = countriesAfterRivalTurns.some(c =>
          (c.rivalPresences.some(rp => rp.rivalId === currentRival.id && rp.influenceLevel > GameConstants.RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD)) ||
          (c.subRegions && c.subRegions.some(sr => sr.rivalPresences.some(rp => rp.rivalId === currentRival.id && rp.influenceLevel > GameConstants.RIVAL_AGGRESSIVE_MIN_INFLUENCE_FOR_NEW_COUNTRY_SPREAD)))
        );
        if (hasStrongPresenceSomewhere) {
          attemptNewCountrySpread = true;
          newCountrySpreadChance = GameConstants.RIVAL_AGGRESSIVE_SPREAD_NEW_COUNTRY_CHANCE + spreadAggressivenessFactor * 0.025;
          newCountryInitialInfluence = GameConstants.RIVAL_AGGRESSIVE_INITIAL_SPREAD_NEW_COUNTRY_AMOUNT + Math.random() * 0.012;
        }
        break;
      }
      case 'CautiousConsolidator': {
        const dominatesACountry = countriesAfterRivalTurns.some(c => {
          let countryTotalRivalInfluence = 0;
          let countryTotalUnits = 0;
          if (c.subRegions && c.subRegions.length > 0) {
            c.subRegions.forEach(sr => {
              const rData = sr.rivalPresences.find(rp => rp.rivalId === currentRival.id);
              if (rData) countryTotalRivalInfluence += rData.influenceLevel;
              countryTotalUnits++;
            });
          } else {
            const rData = c.rivalPresences.find(rp => rp.rivalId === currentRival.id);
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
        newCountrySpreadChance = 0.012 + spreadAggressivenessFactor * 0.018;
        newCountryInitialInfluence = 0.009 + Math.random() * 0.008;
        break;
      case 'IsolationistDefender':
        if (Math.random() < (0.0005 * spreadAggressivenessFactor)) { 
          attemptNewCountrySpread = true;
          newCountrySpreadChance = 0.0005 * spreadAggressivenessFactor;
          newCountryInitialInfluence = 0.001 + Math.random() * 0.002;
        }
        break;
      case 'ZealousPurifier':
        attemptNewCountrySpread = true;
        newCountrySpreadChance = 0.01 + spreadAggressivenessFactor * 0.015; 
        newCountryInitialInfluence = 0.008 + Math.random() * 0.008; 
        break;
    }

    if (attemptNewCountrySpread && Math.random() < newCountrySpreadChance) {
      const uninfluencedOrWeaklyInfluencedCountries = countriesAfterRivalTurns.filter(uc => {
        let rivalPresenceInTargetCountry = 0;
        if (uc.subRegions && uc.subRegions.length > 0) {
          rivalPresenceInTargetCountry = uc.subRegions.reduce((sum, sr) => sum + (sr.rivalPresences.find(rp => rp.rivalId === currentRival.id)?.influenceLevel || 0), 0) / uc.subRegions.length;
        } else {
          rivalPresenceInTargetCountry = uc.rivalPresences.find(rp => rp.rivalId === currentRival.id)?.influenceLevel || 0;
        }
        return rivalPresenceInTargetCountry < 0.001; 
      });

      if (uninfluencedOrWeaklyInfluencedCountries.length > 0) {
        const targetCountryIndex = Math.floor(Math.random() * uninfluencedOrWeaklyInfluencedCountries.length);
        const targetCountryOriginal = uninfluencedOrWeaklyInfluencedCountries[targetCountryIndex];
        
        const countryToModifyIndex = countriesAfterRivalTurns.findIndex(c => c.id === targetCountryOriginal.id);

        if (countryToModifyIndex !== -1) {
            let targetCountryToModify: Country = deepClone(countriesAfterRivalTurns[countryToModifyIndex]);
            let targetSpreadRegion: SubRegion | Country;
            let isTargetSubRegion = false;
            let subRegionIndexToUpdate = -1;

            if (targetCountryToModify.subRegions && targetCountryToModify.subRegions.length > 0) {
                const randomSubRegionIndex = Math.floor(Math.random() * targetCountryToModify.subRegions.length);
                targetSpreadRegion = deepClone(targetCountryToModify.subRegions[randomSubRegionIndex]);
                isTargetSubRegion = true;
                subRegionIndexToUpdate = randomSubRegionIndex;
            } else {
                targetSpreadRegion = targetCountryToModify;
            }

            let currentRivalInfluenceInTarget = targetSpreadRegion.rivalPresences.find(rp => rp.rivalId === currentRival.id)?.influenceLevel || 0;
            let playerAdoptionInTarget = targetSpreadRegion.adoptionLevel;
            let otherRivalsTotalInTarget = targetSpreadRegion.rivalPresences.filter(rp => rp.rivalId !== currentRival.id).reduce((s, rp) => s + rp.influenceLevel, 0);
            let actualInitialGainForNewCountry = 0;

            const totalSpaceOccupiedByOthersAndPlayer = playerAdoptionInTarget + otherRivalsTotalInTarget + currentRivalInfluenceInTarget;
            const emptySpace = Math.max(0, 1.0 - totalSpaceOccupiedByOthersAndPlayer);
            
            let gainFromEmptySpace = Math.min(newCountryInitialInfluence, emptySpace);
            actualInitialGainForNewCountry += gainFromEmptySpace;

            let remainingGain = newCountryInitialInfluence - gainFromEmptySpace;
            const totalInfluenceToTakeFrom = playerAdoptionInTarget + otherRivalsTotalInTarget;

            if (remainingGain > 0 && totalInfluenceToTakeFrom > 0) {
              const influenceTaken = Math.min(remainingGain, totalInfluenceToTakeFrom);
              actualInitialGainForNewCountry += influenceTaken;
              if (playerAdoptionInTarget > 0) {
                const playerProportion = totalInfluenceToTakeFrom > 0 ? playerAdoptionInTarget / totalInfluenceToTakeFrom : 0;
                targetSpreadRegion.adoptionLevel = Math.max(0, playerAdoptionInTarget - (playerProportion * influenceTaken));
              }
              targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.map(orp => {
                if (orp.rivalId === currentRival.id) return orp;
                if (otherRivalsTotalInTarget > 0) {
                  const otherRivalProp = totalInfluenceToTakeFrom > 0 ? orp.influenceLevel / totalInfluenceToTakeFrom : 0;
                  return { ...orp, influenceLevel: Math.max(0, orp.influenceLevel - (otherRivalProp * influenceTaken)) };
                }
                return orp;
              }).filter(rp => rp.influenceLevel > 0.001 || rp.rivalId === currentRival.id);
            }

            const rivalIdxNew = targetSpreadRegion.rivalPresences.findIndex(rp => rp.rivalId === currentRival.id);
            if (rivalIdxNew !== -1) {
              targetSpreadRegion.rivalPresences[rivalIdxNew].influenceLevel = Math.min(1, (targetSpreadRegion.rivalPresences[rivalIdxNew].influenceLevel || 0) + actualInitialGainForNewCountry);
            } else if (actualInitialGainForNewCountry > 0.001) {
              targetSpreadRegion.rivalPresences.push({ rivalId: currentRival.id, influenceLevel: actualInitialGainForNewCountry });
            }
            targetSpreadRegion.rivalPresences = targetSpreadRegion.rivalPresences.filter(rp => rp.influenceLevel > 0.001);
            targetSpreadRegion.adoptionLevel = Math.max(0, targetSpreadRegion.adoptionLevel);

            if (actualInitialGainForNewCountry > 0.001) {
              if (isTargetSubRegion && targetCountryToModify.subRegions && subRegionIndexToUpdate !== -1) {
                targetCountryToModify.subRegions[subRegionIndexToUpdate] = targetSpreadRegion as SubRegion;
              } else {
                targetCountryToModify = targetSpreadRegion as Country;
              }
              countriesAfterRivalTurns[countryToModifyIndex] = targetCountryToModify;
              localEventSummaryForInterCountrySpread += ` ${currentRival.name} makes a push into ${targetSpreadRegion.name}${isTargetSubRegion ? ` within the ${targetCountryToModify.name}` : ''}.`;
            }
        }
      }
    }
    accumulatedEventSummary += localEventSummaryForInterCountrySpread;
    return currentRival; 
  });

  if (accumulatedEventSummary) {
    addRecentEventEntry(accumulatedEventSummary);
  }

  return {
    updatedCountries: countriesAfterRivalTurns,
    updatedRivalMovements: finalUpdatedRivals,
  };
}
