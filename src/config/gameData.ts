
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
  { id: 'expr_social_media', name: 'Social Media Presence', description: 'Establishes a basic online presence, allowing for wider reach and faster initial spread in digitally connected regions. Unlocks sharing capabilities.', cost: 10, icon: MessageSquare, category: 'expression_methods', isEvolved: false },
  { id: 'expr_apps', name: 'Dedicated App', description: 'Develops a mobile application for your movement, fostering a dedicated community and enabling targeted content delivery. Boosts engagement in regions with high smartphone penetration.', cost: 20, icon: Zap, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media'] },
  { id: 'expr_gatherings', name: 'Physical Gatherings', description: 'Organizes local meetups and events, strengthening community bonds and increasing adoption in areas with strong local networks. Effective in both urban and rural settings.', cost: 15, icon: UsersRound, category: 'expression_methods', isEvolved: false },
  { id: 'expr_media_broadcast', name: 'Media Broadcast', description: 'Gains presence on traditional media like TV & Radio. Significantly increases awareness in regions with high traditional media consumption, bypassing digital divides.', cost: 30, icon: Tv, category: 'expression_methods', isEvolved: false },
  { id: 'expr_word_of_mouth', name: 'Word of Mouth Network', description: 'Encourages and empowers individuals to share the movement through personal testimonials and conversations. Provides a slow but steady and resilient form of spread.', cost: 5, icon: Hand, category: 'expression_methods', isEvolved: false },
  { id: 'expr_influencers', name: 'Influencer Network', description: 'Collaborates with online personalities and thought leaders to promote the movement. Highly effective for reaching specific demographics and accelerating online adoption.', cost: 25, icon: Rss, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media']},
  { 
    id: 'expr_viral_studio', 
    name: 'Viral Content Studio', 
    description: 'Creates a dedicated team and infrastructure for producing high-quality, engaging, and shareable content tailored for digital platforms. Significantly boosts online spread rate and engagement metrics.', 
    cost: 40, 
    icon: Film, 
    category: 'expression_methods', 
    isEvolved: false, 
    prerequisites: ['expr_apps', 'expr_influencers'],
    specialAbilityName: "Cultural Resonance",
    specialAbilityDescription: "Content produced by the studio is 20% more effective at increasing adoption. Additionally, there's a chance each turn to trigger a 'Trending Topic' mini-event, granting bonus Influence Points."
  },

  // Cultural Elements
  { id: 'elem_aesthetic_style', name: 'Visual Style & Branding', description: 'Defines a unique and recognizable aesthetic for the movement, including logos, color palettes, and design language. Increases appeal and memorability.', cost: 10, icon: Palette, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_rituals', name: 'Community Rituals & Practices', description: 'Establishes shared practices, ceremonies, or regular events that reinforce the movement\'s values and build community cohesion. Deepens engagement among adherents.', cost: 15, icon: Sparkles, category: 'cultural_elements', isEvolved: false }, // Changed icon for variety
  { id: 'elem_value_system', name: 'Core Values & Manifesto', description: 'Articulates a clear set of guiding principles, beliefs, and goals for the movement. Provides intellectual and moral grounding, attracting those who align with its philosophy.', cost: 20, icon: BrainCog, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_language', name: 'Unique Language/Jargon', description: 'Develops specialized vocabulary, slang, or terminology unique to the movement. Fosters a sense of in-group identity and shared understanding among followers.', cost: 15, icon: Speech, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_concepts', name: 'Key Concepts & Teachings', description: 'Introduces novel ideas, theories, or interpretations that form the intellectual core of the movement. Essential for movements focused on philosophy, science, or education.', cost: 25, icon: Lightbulb, category: 'cultural_elements', isEvolved: false },
  
  // Adaptability
  { id: 'adapt_integration', name: 'Cultural Integration Strategies', description: 'Develops methods to blend the movement with existing local customs, traditions, and values. Reduces cultural friction and resistance in diverse regions.', cost: 20, icon: Merge, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resource_eff', name: 'Resource Efficiency', description: 'Optimizes the resources needed for individuals to adopt and participate in the movement, making it more accessible in economically diverse regions. Lowers perceived cost of adoption.', cost: 15, icon: DollarSign, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resistance_mgmt', name: 'Resistance Management Tactics', description: 'Implements strategies to understand, address, and counter opposing viewpoints and organized resistance. Reduces the growth of resistance and mitigates its negative impact.', cost: 25, icon: ShieldAlert, category: 'adaptability', isEvolved: false },
  { id: 'adapt_urban', name: 'Urban Adaptation', description: 'Tailors the movement\'s messaging and activities to thrive in densely populated urban environments. Leverages city infrastructure and networks for faster spread.', cost: 10, icon: Building2, category: 'adaptability', isEvolved: false },
  { id: 'adapt_rural', name: 'Rural Adaptation', description: 'Adapts the movement to effectively spread and take root in less densely populated rural areas and remote communities. Addresses unique challenges of rural outreach.', cost: 10, icon: Trees, category: 'adaptability', isEvolved: false },
  { 
    id: 'adapt_demographic_appeal', 
    name: 'Broad Demographic Appeal', 
    description: 'Refines the movement to resonate with a wider range of age groups, social classes, and cultural backgrounds. Increases overall potential adoption rate and reduces demographic-specific resistance.', 
    cost: 30, 
    icon: UserCheck, 
    category: 'adaptability', 
    isEvolved: false,
    specialAbilityName: "Universal Harmony",
    specialAbilityDescription: "Significantly reduces the baseline resistance generation rate in all influenced regions. Unlocks special 'Unity Dialogue' options during certain global events, potentially converting resistant populations peacefully."
  },

  // New Extensive Items
  // Expression Methods
  { 
    id: 'expr_grassroots_kits', 
    name: 'Grassroots Organizing Kits', 
    description: 'Provides toolkits, funding, and training for local leaders to independently organize events and promote the movement, enhancing local adoption and authenticity.', 
    cost: 25, 
    icon: Megaphone, 
    category: 'expression_methods', 
    isEvolved: false, 
    prerequisites: ['expr_word_of_mouth', 'expr_gatherings']
  },
  { 
    id: 'expr_global_syndication', 
    name: 'Global Media Syndication', 
    description: 'Establishes partnerships to distribute cultural content through international media networks, creating a persistent global presence.', 
    cost: 50, 
    icon: TrendingUp, 
    category: 'expression_methods', 
    isEvolved: false, 
    prerequisites: ['expr_media_broadcast', 'expr_viral_studio'],
    specialAbilityName: "Ubiquitous Presence",
    specialAbilityDescription: "All media-based expressions (Broadcast, Viral Studio) become 15% more effective globally. Reduces cost of future media-related evolutions by 10%."
  },

  // Cultural Elements
  { 
    id: 'elem_mythology_lore', 
    name: 'Mythology & Lore Creation', 
    description: 'Develops a rich tapestry of stories, myths, historical narratives, and symbolic figures that deepen the cultural narrative and emotional connection for adherents.', 
    cost: 30, 
    icon: BrainCog, // Re-using BrainCog as it fits well
    category: 'cultural_elements', 
    isEvolved: false, 
    prerequisites: ['elem_value_system', 'elem_concepts']
  },
  { 
    id: 'elem_interactive_education', 
    name: 'Interactive Educational Platform', 
    description: 'Creates an online platform with courses, simulations, and interactive content about the movement\'s core tenets, boosting retention and deeper understanding among adherents.', 
    cost: 35, 
    icon: School, // Re-using School
    category: 'cultural_elements', 
    isEvolved: false, 
    prerequisites: ['elem_concepts', 'expr_apps']
  },

  // Adaptability
  { 
    id: 'adapt_ai_localization', 
    name: 'AI-Powered Localization Engine', 
    description: 'Utilizes advanced AI to rapidly translate and culturally adapt content for diverse languages and regional nuances, dramatically increasing integration speed and relevance.', 
    cost: 45, 
    icon: GitFork, 
    category: 'adaptability', 
    isEvolved: false, 
    prerequisites: ['adapt_integration', 'expr_apps'],
    specialAbilityName: "Hyper-Adaptation",
    specialAbilityDescription: "Reduces cultural resistance penalties arising from regional differences by 50%. Automatically translates basic communications to any region."
  },
  { 
    id: 'adapt_crisis_protocol', 
    name: 'Global Crisis Response Protocol', 
    description: 'Establishes protocols, resources, and communication channels to swiftly adapt messaging and support adherents during global crises, maintaining loyalty and preventing spread decline.', 
    cost: 30, 
    icon: Siren, 
    category: 'adaptability', 
    isEvolved: false, 
    prerequisites: ['adapt_resistance_mgmt']
  },
];

const usaSubRegions: SubRegion[] = [
  { id: 'usa_ne', name: 'Northeast', adoptionLevel: 0.0, resistanceLevel: 0.12, economicDevelopment: 0.92, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.88, mediaFreedom: 0.82 },
  { id: 'usa_s', name: 'South', adoptionLevel: 0.0, resistanceLevel: 0.15, economicDevelopment: 0.85, culturalOpenness: 0.65, internetPenetration: 0.88, educationLevel: 0.82, mediaFreedom: 0.78 },
  { id: 'usa_mw', name: 'Midwest', adoptionLevel: 0.0, resistanceLevel: 0.10, economicDevelopment: 0.88, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.80 },
  { id: 'usa_w', name: 'West', adoptionLevel: 0.0, resistanceLevel: 0.08, economicDevelopment: 0.95, culturalOpenness: 0.80, internetPenetration: 0.93, educationLevel: 0.90, mediaFreedom: 0.85 },
];

const chinaSubRegions: SubRegion[] = [
  { id: 'china_e', name: 'East Coast Cities', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.85, culturalOpenness: 0.45, internetPenetration: 0.75, educationLevel: 0.78, mediaFreedom: 0.15 },
  { id: 'china_w_rural', name: 'West Inland Rural', adoptionLevel: 0, resistanceLevel: 0.35, economicDevelopment: 0.60, culturalOpenness: 0.30, internetPenetration: 0.45, educationLevel: 0.60, mediaFreedom: 0.10 },
  { id: 'china_n_industrial', name: 'North Industrial Belt', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.70, culturalOpenness: 0.35, internetPenetration: 0.65, educationLevel: 0.70, mediaFreedom: 0.12 },
  { id: 'china_s_special_econ', name: 'South Special Economic Zones', adoptionLevel: 0, resistanceLevel: 0.28, economicDevelopment: 0.78, culturalOpenness: 0.40, internetPenetration: 0.70, educationLevel: 0.72, mediaFreedom: 0.14 },
];

const indiaSubRegions: SubRegion[] = [
  { id: 'india_n_plains', name: 'North Indo-Gangetic Plain', adoptionLevel: 0, resistanceLevel: 0.22, economicDevelopment: 0.58, culturalOpenness: 0.62, internetPenetration: 0.42, educationLevel: 0.62, mediaFreedom: 0.52 },
  { id: 'india_s_tech_hubs', name: 'South Tech Hubs', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.65, culturalOpenness: 0.68, internetPenetration: 0.48, educationLevel: 0.65, mediaFreedom: 0.55 },
  { id: 'india_e_tribal', name: 'East Tribal Regions', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.55, culturalOpenness: 0.58, internetPenetration: 0.38, educationLevel: 0.58, mediaFreedom: 0.48 },
  { id: 'india_w_financial', name: 'West Financial Centers', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.62, culturalOpenness: 0.65, internetPenetration: 0.45, educationLevel: 0.63, mediaFreedom: 0.53 },
];

const brazilSubRegions: SubRegion[] = [
  { id: 'brazil_se_metro', name: 'Southeast Megalopolis', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.70, culturalOpenness: 0.82, internetPenetration: 0.75, educationLevel: 0.72, mediaFreedom: 0.62 },
  { id: 'brazil_ne_coastal', name: 'Northeast Coastal', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.55, culturalOpenness: 0.75, internetPenetration: 0.60, educationLevel: 0.65, mediaFreedom: 0.58 },
  { id: 'brazil_n_amazon', name: 'North (Amazon Basin)', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.45, culturalOpenness: 0.70, internetPenetration: 0.50, educationLevel: 0.60, mediaFreedom: 0.55 },
  { id: 'brazil_cs_agri', name: 'Central-South Agri-business', adoptionLevel: 0, resistanceLevel: 0.15, economicDevelopment: 0.65, culturalOpenness: 0.78, internetPenetration: 0.68, educationLevel: 0.70, mediaFreedom: 0.60 },
];

const nigeriaSubRegions: SubRegion[] = [
  { id: 'nigeria_sw_lagos', name: 'Southwest (Lagos Metro)', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.50, culturalOpenness: 0.55, internetPenetration: 0.60, educationLevel: 0.55, mediaFreedom: 0.42 },
  { id: 'nigeria_n_kano', name: 'North (Kano Region)', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.30, culturalOpenness: 0.40, internetPenetration: 0.40, educationLevel: 0.45, mediaFreedom: 0.35 },
  { id: 'nigeria_se_delta', name: 'Southeast (Niger Delta)', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.35, culturalOpenness: 0.48, internetPenetration: 0.45, educationLevel: 0.50, mediaFreedom: 0.38 },
  { id: 'nigeria_mc_jos', name: 'Middle Belt (Jos Plateau)', adoptionLevel: 0, resistanceLevel: 0.28, economicDevelopment: 0.32, culturalOpenness: 0.45, internetPenetration: 0.42, educationLevel: 0.48, mediaFreedom: 0.37 },
];

const germanySubRegions: SubRegion[] = [
  { id: 'germany_w_rhine', name: 'West (Rhine-Ruhr)', adoptionLevel: 0, resistanceLevel: 0.08, economicDevelopment: 0.88, culturalOpenness: 0.78, internetPenetration: 0.94, educationLevel: 0.90, mediaFreedom: 0.92 },
  { id: 'germany_e_berlin', name: 'East (Berlin-Brandenburg)', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.80, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.88 },
  { id: 'germany_s_bavaria', name: 'South (Bavaria)', adoptionLevel: 0, resistanceLevel: 0.09, economicDevelopment: 0.90, culturalOpenness: 0.76, internetPenetration: 0.93, educationLevel: 0.89, mediaFreedom: 0.91 },
  { id: 'germany_n_hamburg', name: 'North (Hamburg Port)', adoptionLevel: 0, resistanceLevel: 0.10, economicDevelopment: 0.85, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.87, mediaFreedom: 0.90 },
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
    offsets: [ { top: '-4%', left: '-3%' }, { top: '4%', left: '-5%' }, { top: '0%', left: '4%' }, { top: '6%', left: '2%' } ],
  },
  india: {
    baseTop: '45%', baseLeft: '65%',
    offsets: [ { top: '-4%', left: '0%' }, { top: '3%', left: '-4%' }, { top: '3%', left: '4%' }, { top: '7%', left: '0%' } ],
  },
  brazil: {
    baseTop: '60%', baseLeft: '30%',
    offsets: [ { top: '-4%', left: '-2%' }, { top: '3%', left: '-4%' }, { top: '0%', left: '5%' }, { top: '6%', left: '2%' } ],
  },
  nigeria: {
    baseTop: '55%', baseLeft: '50%',
    offsets: [ { top: '-3%', left: '-3%' }, { top: '3%', left: '0%' }, { top: '-2%', left: '4%' }, { top: '5%', left: '3%' } ],
  },
  germany: {
    baseTop: '30%', baseLeft: '52%',
    offsets: [ { top: '-4%', left: '-2%' }, { top: '4%', left: '0%' }, { top: '0%', left: '4%' }, { top: '-3%', left: '6%'} ],
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

    