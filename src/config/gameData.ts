
import type { CulturalMovement, EvolutionItem, EvolutionCategory, Country, SubRegion, GlobalEvent } from '@/types';
import { Cpu, Palette, Brain, Users, FlaskConical, Ticket, School, Sparkles, Zap, MessageSquare, UsersRound, Tv, Hand, Rss, Merge, DollarSign, ShieldAlert, Globe, Building2, UserCheck, Siren, CloudCog, BrainCog, Lightbulb, Speech, GitFork, Trees, MountainSnow, Factory, Film, Award, Megaphone, TrendingUp } from 'lucide-react';

export const CULTURAL_MOVEMENTS: CulturalMovement[] = [
  { id: 'digital_revolution', name: 'Digital Revolution', description: 'Fast-spreading through technology networks', icon: Cpu },
  { id: 'artistic_expression', name: 'Artistic Expression', description: 'Appealing to emotions and creativity', icon: Palette },
  { id: 'philosophy_movement', name: 'Philosophy', description: 'Deep but slow transformation of thought', icon: Brain },
  { id: 'social_movement', name: 'Social Movement', description: 'Grassroots spread through communities', icon: Users },
  { id: 'scientific_paradigm', name: 'Scientific Paradigm', description: 'Evidence-based but faces skepticism', icon: FlaskConical },
  { id: 'entertainment_trend', name: 'Entertainment Trend', description: 'Highly accessible but potentially shallow', icon: Ticket },
  { id: 'educational_system', name: 'Educational System', description: 'Long-lasting but difficult to implement', icon: School },
  { id: 'spiritual_practice', name: 'Spiritual Practice', description: 'Deeply transformative but faces religious resistance', icon: Sparkles },
];

export const EVOLUTION_CATEGORIES: EvolutionCategory[] = [
  { id: 'expression_methods', name: 'Expression Methods', description: 'How your culture spreads.' },
  { id: 'cultural_elements', name: 'Cultural Elements', description: 'The core components of your culture.' },
  { id: 'adaptability', name: 'Adaptability', description: 'How your culture survives and thrives.' },
];

export const EVOLUTION_ITEMS: EvolutionItem[] = [
  // Expression Methods
  { id: 'expr_social_media', name: 'Social Media Presence', description: 'Basic online sharing', cost: 10, icon: MessageSquare, category: 'expression_methods', isEvolved: false },
  { id: 'expr_apps', name: 'Dedicated App', description: 'Mobile community platform', cost: 20, icon: Zap, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media'] },
  { id: 'expr_gatherings', name: 'Physical Gatherings', description: 'Local community meetups', cost: 15, icon: UsersRound, category: 'expression_methods', isEvolved: false },
  { id: 'expr_media_broadcast', name: 'Media Broadcast', description: 'TV & Radio presence', cost: 30, icon: Tv, category: 'expression_methods', isEvolved: false },
  { id: 'expr_word_of_mouth', name: 'Word of Mouth', description: 'Personal testimonials', cost: 5, icon: Hand, category: 'expression_methods', isEvolved: false },
  { id: 'expr_influencers', name: 'Influencer Network', description: 'Leverage online personalities', cost: 25, icon: Rss, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media']},
  { id: 'expr_viral_studio', name: 'Viral Content Studio', description: 'Produce highly shareable content leveraging apps and influencers.', cost: 40, icon: Film, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_apps', 'expr_influencers']},

  // Cultural Elements
  { id: 'elem_aesthetic_style', name: 'Visual Style', description: 'Define a unique look', cost: 10, icon: Palette, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_rituals', name: 'Community Rituals', description: 'Shared practices and events', cost: 15, icon: Zap, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_value_system', name: 'Core Values', description: 'Establish guiding principles', cost: 20, icon: BrainCog, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_language', name: 'Unique Language/Jargon', description: 'Specialized vocabulary', cost: 15, icon: Speech, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_concepts', name: 'Key Concepts', description: 'Novel ideas and theories', cost: 25, icon: Lightbulb, category: 'cultural_elements', isEvolved: false },
  
  // Adaptability
  { id: 'adapt_integration', name: 'Cultural Integration', description: 'Blend with local customs', cost: 20, icon: Merge, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resource_eff', name: 'Resource Efficiency', description: 'Lower cost of adoption', cost: 15, icon: DollarSign, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resistance_mgmt', name: 'Resistance Management', description: 'Counter opposing forces', cost: 25, icon: ShieldAlert, category: 'adaptability', isEvolved: false },
  { id: 'adapt_urban', name: 'Urban Adaptation', description: 'Thrive in cities', cost: 10, icon: Building2, category: 'adaptability', isEvolved: false },
  { id: 'adapt_rural', name: 'Rural Adaptation', description: 'Spread in countryside', cost: 10, icon: Trees, category: 'adaptability', isEvolved: false },
  { id: 'adapt_demographic_appeal', name: 'Broad Demographic Appeal', description: 'Appeal to diverse groups', cost: 30, icon: UserCheck, category: 'adaptability', isEvolved: false },
];

const usaSubRegions: SubRegion[] = [
  { id: 'usa_ne', name: 'Northeast', adoptionLevel: 0.0, resistanceLevel: 0.12, economicDevelopment: 0.92, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.88, mediaFreedom: 0.82 },
  { id: 'usa_s', name: 'South', adoptionLevel: 0.0, resistanceLevel: 0.15, economicDevelopment: 0.85, culturalOpenness: 0.65, internetPenetration: 0.88, educationLevel: 0.82, mediaFreedom: 0.78 },
  { id: 'usa_mw', name: 'Midwest', adoptionLevel: 0.0, resistanceLevel: 0.10, economicDevelopment: 0.88, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.80 },
  { id: 'usa_w', name: 'West', adoptionLevel: 0.0, resistanceLevel: 0.08, economicDevelopment: 0.95, culturalOpenness: 0.80, internetPenetration: 0.93, educationLevel: 0.90, mediaFreedom: 0.85 },
];

const chinaSubRegions: SubRegion[] = [
  { id: 'china_e', name: 'East Coast', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.85, culturalOpenness: 0.45, internetPenetration: 0.75, educationLevel: 0.78, mediaFreedom: 0.15 },
  { id: 'china_w', name: 'West Inland', adoptionLevel: 0, resistanceLevel: 0.35, economicDevelopment: 0.60, culturalOpenness: 0.30, internetPenetration: 0.45, educationLevel: 0.60, mediaFreedom: 0.10 },
  { id: 'china_n', name: 'North', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.70, culturalOpenness: 0.35, internetPenetration: 0.65, educationLevel: 0.70, mediaFreedom: 0.12 },
];

const indiaSubRegions: SubRegion[] = [
  { id: 'india_n', name: 'North India', adoptionLevel: 0, resistanceLevel: 0.22, economicDevelopment: 0.58, culturalOpenness: 0.62, internetPenetration: 0.42, educationLevel: 0.62, mediaFreedom: 0.52 },
  { id: 'india_s', name: 'South India', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.65, culturalOpenness: 0.68, internetPenetration: 0.48, educationLevel: 0.65, mediaFreedom: 0.55 },
  { id: 'india_e', name: 'East India', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.55, culturalOpenness: 0.58, internetPenetration: 0.38, educationLevel: 0.58, mediaFreedom: 0.48 },
];

const brazilSubRegions: SubRegion[] = [
  { id: 'brazil_se', name: 'Southeast', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.70, culturalOpenness: 0.82, internetPenetration: 0.75, educationLevel: 0.72, mediaFreedom: 0.62 },
  { id: 'brazil_ne', name: 'Northeast', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.55, culturalOpenness: 0.75, internetPenetration: 0.60, educationLevel: 0.65, mediaFreedom: 0.58 },
  { id: 'brazil_n', name: 'North (Amazon)', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.45, culturalOpenness: 0.70, internetPenetration: 0.50, educationLevel: 0.60, mediaFreedom: 0.55 },
];

const nigeriaSubRegions: SubRegion[] = [
  { id: 'nigeria_sw', name: 'Southwest (Lagos)', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.50, culturalOpenness: 0.55, internetPenetration: 0.60, educationLevel: 0.55, mediaFreedom: 0.42 },
  { id: 'nigeria_n', name: 'North', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.30, culturalOpenness: 0.40, internetPenetration: 0.40, educationLevel: 0.45, mediaFreedom: 0.35 },
  { id: 'nigeria_se', name: 'Southeast', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.35, culturalOpenness: 0.48, internetPenetration: 0.45, educationLevel: 0.50, mediaFreedom: 0.38 },
];

const germanySubRegions: SubRegion[] = [
  { id: 'germany_w', name: 'West Germany', adoptionLevel: 0, resistanceLevel: 0.08, economicDevelopment: 0.88, culturalOpenness: 0.78, internetPenetration: 0.94, educationLevel: 0.90, mediaFreedom: 0.92 },
  { id: 'germany_e', name: 'East Germany', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.80, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.88 },
  { id: 'germany_s', name: 'South Germany', adoptionLevel: 0, resistanceLevel: 0.09, economicDevelopment: 0.90, culturalOpenness: 0.76, internetPenetration: 0.93, educationLevel: 0.89, mediaFreedom: 0.91 },
];

export const INITIAL_COUNTRIES: Country[] = [
  { 
    id: 'usa', name: 'USA', 
    internetPenetration: 0.9, educationLevel: 0.85, economicDevelopment: 0.9, 
    culturalOpenness: 0.7, mediaFreedom: 0.8, 
    adoptionLevel: 0, resistanceLevel: 0.1,
    subRegions: usaSubRegions,
  },
  { 
    id: 'china', name: 'China', 
    internetPenetration: 0.6, educationLevel: 0.7, economicDevelopment: 0.75, 
    culturalOpenness: 0.4, mediaFreedom: 0.2, 
    adoptionLevel: 0, resistanceLevel: 0.3,
    subRegions: chinaSubRegions,
  },
  { 
    id: 'india', name: 'India', 
    internetPenetration: 0.4, educationLevel: 0.6, economicDevelopment: 0.6, 
    culturalOpenness: 0.6, mediaFreedom: 0.5, 
    adoptionLevel: 0, resistanceLevel: 0.2,
    subRegions: indiaSubRegions,
  },
  { 
    id: 'brazil', name: 'Brazil', 
    internetPenetration: 0.7, educationLevel: 0.7, economicDevelopment: 0.65, 
    culturalOpenness: 0.8, mediaFreedom: 0.6, 
    adoptionLevel: 0, resistanceLevel: 0.15,
    subRegions: brazilSubRegions,
  },
  { 
    id: 'nigeria', name: 'Nigeria', 
    internetPenetration: 0.5, educationLevel: 0.5, economicDevelopment: 0.4, 
    culturalOpenness: 0.5, mediaFreedom: 0.4, 
    adoptionLevel: 0, resistanceLevel: 0.25,
    subRegions: nigeriaSubRegions,
  },
  { 
    id: 'germany', name: 'Germany', 
    internetPenetration: 0.92, educationLevel: 0.88, economicDevelopment: 0.85, 
    culturalOpenness: 0.75, mediaFreedom: 0.9, 
    adoptionLevel: 0, resistanceLevel: 0.1,
    subRegions: germanySubRegions,
  },
];

export const STARTING_INFLUENCE_POINTS = 50;

export const subRegionPositions: Record<string, { baseTop: string; baseLeft: string; offsets: {top: string; left: string}[] }> = {
  usa: {
    baseTop: '30%', baseLeft: '20%',
    offsets: [ { top: '-5%', left: '-5%' }, { top: '5%', left: '-3%' }, { top: '-3%', left: '5%' }, { top: '3%', left: '8%' } ],
  },
  china: {
    baseTop: '35%', baseLeft: '70%',
    offsets: [ { top: '-4%', left: '-3%' }, { top: '4%', left: '-5%' }, { top: '0%', left: '4%' } ],
  },
  india: {
    baseTop: '45%', baseLeft: '65%',
    offsets: [ { top: '-4%', left: '0%' }, { top: '3%', left: '-4%' }, { top: '3%', left: '4%' } ],
  },
  brazil: {
    baseTop: '60%', baseLeft: '30%',
    offsets: [ { top: '-4%', left: '-2%' }, { top: '3%', left: '-4%' }, { top: '0%', left: '5%' } ],
  },
  nigeria: {
    baseTop: '55%', baseLeft: '50%',
    offsets: [ { top: '-3%', left: '-3%' }, { top: '3%', left: '0%' }, { top: '-2%', left: '4%' } ],
  },
  germany: {
    baseTop: '30%', baseLeft: '52%',
    offsets: [ { top: '-4%', left: '-2%' }, { top: '4%', left: '0%' }, { top: '0%', left: '4%' } ],
  },
};


export const POTENTIAL_GLOBAL_EVENTS: GlobalEvent[] = [
  {
    id: 'global_internet_renaissance',
    name: 'Global Internet Renaissance',
    description: 'A wave of new infrastructure and accessibility sweeps the globe, making online communication easier.',
    turnStart: 3,
    duration: 5, 
    effects: [ 
      { targetType: 'global', property: 'culturalOpenness', value: 0.05, isMultiplier: false },
      { targetType: 'global', property: 'adoptionRateModifier', value: 1.1, isMultiplier: true } 
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'economic_crisis_china',
    name: 'Economic Crisis in China',
    description: 'China faces an unexpected economic downturn, leading to social unrest and a re-evaluation of priorities. How do you leverage this?',
    turnStart: 6,
    duration: 4,
    effects: [], // Base effects are replaced by chosen option
    options: [
      {
        id: 'crisis_invest_china',
        text: 'Invest in Cultural Outreach (Cost: 20 IP)',
        description: 'Launch targeted campaigns in China, hoping to offer solace and new perspectives. Reduces resistance slightly, small adoption boost in China, but costs IP.',
        effects: [
          { targetType: 'country', countryId: 'china', property: 'resistanceLevel', value: -0.03, isMultiplier: false }, // This effect might need to be distributed to sub-regions or handled carefully.
          { targetType: 'country', countryId: 'china', property: 'adoptionRateModifier', value: 1.05, isMultiplier: true },
          { targetType: 'global', property: 'ipBonus', value: -20, isMultiplier: false }, // Cost
        ],
      },
      {
        id: 'crisis_focus_elsewhere_china',
        text: 'Focus Efforts Elsewhere',
        description: 'Avoid entanglement in China\'s crisis and focus your resources on more stable regions. Slight global adoption boost due to focused efforts.',
        effects: [
          { targetType: 'global', property: 'adoptionRateModifier', value: 1.03, isMultiplier: true }, 
        ],
      },
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'international_peace_prize',
    name: 'International Peace Prize Awarded',
    description: 'Your cultural movement is recognized with a prestigious International Peace Prize, boosting its legitimacy.',
    turnStart: 10,
    duration: 1, 
    effects: [
      { targetType: 'global', property: 'ipBonus', value: 50, isMultiplier: false },
      { targetType: 'global', property: 'resistanceLevel', value: -0.02, isMultiplier: false } // Global resistance reduction
    ],
    hasBeenTriggered: false,
  },
   {
    id: 'global_tech_conference',
    name: 'Global Tech Conference',
    description: 'A major technology conference showcases new digital tools, temporarily boosting digital adoption globally.',
    turnStart: 4,
    duration: 2,
    effects: [
      { targetType: 'global', property: 'adoptionRateModifier', value: 1.05, isMultiplier: true },
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'cultural_olympics_germany',
    name: 'Cultural Olympics in Germany',
    description: 'Germany hosts a global cultural festival, increasing its openness to new ideas.',
    turnStart: 9,
    duration: 3,
    effects: [
      { targetType: 'country', countryId: 'germany', property: 'culturalOpenness', value: 0.15, isMultiplier: false },
      { targetType: 'country', countryId: 'germany', property: 'adoptionRateModifier', value: 1.1, isMultiplier: true },
    ],
    hasBeenTriggered: false,
  }
];
