
import type { CulturalMovement, EvolutionItem, EvolutionCategory, Country, SubRegion, GlobalEvent, RivalMovement } from '@/types';
import { Cpu, Palette, Brain, Users, FlaskConical, Ticket, School, Sparkles, Zap, MessageSquare, UsersRound, Tv, Hand, Rss, Merge, DollarSign, ShieldAlert, Globe, Building2, UserCheck, Siren, CloudCog, BrainCog, Lightbulb, Speech, GitFork, Trees, MountainSnow, Factory, Film, Award, Megaphone, TrendingUp, Bot, Pyramid } from 'lucide-react';

export const CULTURAL_MOVEMENTS: CulturalMovement[] = [
  { id: 'digital_nexus', name: 'Digital Nexus', description: 'Rapidly connects minds through information networks.', icon: Cpu },
  { id: 'chromatic_dream', name: 'Chromatic Dream', description: 'Inspires hearts with vibrant artistic visions.', icon: Palette },
  { id: 'noetic_philosophy', name: 'Noetic Philosophy', description: 'Profoundly reshapes understanding and thought.', icon: Brain },
  { id: 'communal_harmony', name: 'Communal Harmony', description: 'Builds bonds through grassroots community action.', icon: Users },
  { id: 'paradigm_shift', name: 'Scientific Paradigm', description: 'Challenges old views with new discoveries.', icon: FlaskConical },
  { id: 'echo_festival', name: 'Echo Festival', description: 'Captivates masses with accessible entertainment.', icon: Ticket },
  { id: 'lore_keepers', name: 'Lore Keepers Order', description: 'Preserves and transmits wisdom through generations.', icon: School },
  { id: 'astral_accord', name: 'Astral Accord', description: 'Unites souls through spiritual insight and practice.', icon: Sparkles },
];

export const EVOLUTION_CATEGORIES: EvolutionCategory[] = [
  { id: 'expression_methods', name: 'Expression Methods', description: 'How your culture spreads.' },
  { id: 'cultural_elements', name: 'Cultural Elements', description: 'The core components of your culture.' },
  { id: 'adaptability', name: 'Adaptability', description: 'How your culture survives and thrives.' },
];

export const EVOLUTION_ITEMS: EvolutionItem[] = [
  // Expression Methods
  { id: 'expr_social_media', name: 'Digital Echo Chambers', description: 'Establishes a basic online presence, allowing for wider reach and faster initial spread in digitally connected regions. Unlocks sharing capabilities.', cost: 10, icon: MessageSquare, category: 'expression_methods', isEvolved: false },
  { id: 'expr_apps', name: 'Resonance Engine App', description: 'Develops a mobile application for your movement, fostering a dedicated community and enabling targeted content delivery. Boosts engagement in regions with high smartphone penetration.', cost: 20, icon: Zap, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media'] },
  { id: 'expr_gatherings', name: 'Unity Gatherings', description: 'Organizes local meetups and events, strengthening community bonds and increasing adoption in areas with strong local networks. Effective in both urban and rural settings.', cost: 15, icon: UsersRound, category: 'expression_methods', isEvolved: false },
  { id: 'expr_media_broadcast', name: 'Aetheric Broadcasts', description: 'Gains presence on traditional media like TV & Radio. Significantly increases awareness in regions with high traditional media consumption, bypassing digital divides.', cost: 30, icon: Tv, category: 'expression_methods', isEvolved: false },
  { id: 'expr_word_of_mouth', name: 'Whisper Network', description: 'Encourages and empowers individuals to share the movement through personal testimonials and conversations. Provides a slow but steady and resilient form of spread.', cost: 5, icon: Hand, category: 'expression_methods', isEvolved: false },
  { id: 'expr_influencers', name: 'Beacon Network', description: 'Collaborates with online personalities and thought leaders to promote the movement. Highly effective for reaching specific demographics and accelerating online adoption.', cost: 25, icon: Rss, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media']},
  {
    id: 'expr_viral_studio',
    name: 'Ephemeral Arts Studio',
    description: 'Creates a dedicated team and infrastructure for producing high-quality, engaging, and shareable content tailored for digital platforms. Significantly boosts online spread rate and engagement metrics.',
    cost: 40,
    icon: Film,
    category: 'expression_methods',
    isEvolved: false,
    prerequisites: ['expr_apps', 'expr_influencers'],
    specialAbilityName: "Cultural Resonance",
    specialAbilityDescription: "Content produced by the studio is 20% more effective at increasing adoption. Additionally, there's a chance each turn to trigger a 'Trending Topic' mini-event, granting bonus Influence Points."
  },
  {
    id: 'expr_grassroots_kits',
    name: 'Sprout Kits',
    description: 'Provides toolkits, funding, and training for local leaders to independently organize events and promote the movement, enhancing local adoption and authenticity.',
    cost: 25,
    icon: Megaphone,
    category: 'expression_methods',
    isEvolved: false,
    prerequisites: ['expr_word_of_mouth', 'expr_gatherings']
  },
  {
    id: 'expr_global_syndication',
    name: 'Global Harmony Network',
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
  { id: 'elem_aesthetic_style', name: 'Signature Aesthetics', description: 'Defines a unique and recognizable aesthetic for the movement, including logos, color palettes, and design language. Increases appeal and memorability.', cost: 10, icon: Palette, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_rituals', name: 'Harmonic Rituals', description: 'Establishes shared practices, ceremonies, or regular events that reinforce the movement\'s values and build community cohesion. Deepens engagement among adherents.', cost: 15, icon: Sparkles, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_value_system', name: 'Guiding Principles Codex', description: 'Articulates a clear set of guiding principles, beliefs, and goals for the movement. Provides intellectual and moral grounding, attracting those who align with its philosophy.', cost: 20, icon: BrainCog, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_language', name: 'Unity Lexicon', description: 'Develops specialized vocabulary, slang, or terminology unique to the movement. Fosters a sense of in-group identity and shared understanding among followers.', cost: 15, icon: Speech, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_concepts', name: 'Core Axioms & Teachings', description: 'Introduces novel ideas, theories, or interpretations that form the intellectual core of the movement. Essential for movements focused on philosophy, science, or education.', cost: 25, icon: Lightbulb, category: 'cultural_elements', isEvolved: false },
  {
    id: 'elem_mythology_lore',
    name: 'Epoch Weaving',
    description: 'Develops a rich tapestry of stories, myths, historical narratives, and symbolic figures that deepen the cultural narrative and emotional connection for adherents.',
    cost: 30,
    icon: BrainCog, 
    category: 'cultural_elements',
    isEvolved: false,
    prerequisites: ['elem_value_system', 'elem_concepts']
  },
  {
    id: 'elem_interactive_education',
    name: 'Insight Engine Platform',
    description: 'Creates an online platform with courses, simulations, and interactive content about the movement\'s core tenets, boosting retention and deeper understanding among adherents.',
    cost: 35,
    icon: School,
    category: 'cultural_elements',
    isEvolved: false,
    prerequisites: ['elem_concepts', 'expr_apps']
  },

  // Adaptability
  { id: 'adapt_integration', name: 'Cultural Symbiosis', description: 'Develops methods to blend the movement with existing local customs, traditions, and values. Reduces cultural friction and resistance in diverse regions.', cost: 20, icon: Merge, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resource_eff', name: 'Sustainable Participation', description: 'Optimizes the resources needed for individuals to adopt and participate in the movement, making it more accessible in economically diverse regions. Lowers perceived cost of adoption.', cost: 15, icon: DollarSign, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resistance_mgmt', name: 'Discord Dampening', description: 'Implements strategies to understand, address, and counter opposing viewpoints and organized resistance. Reduces the growth of resistance and mitigates its negative impact.', cost: 25, icon: ShieldAlert, category: 'adaptability', isEvolved: false },
  { id: 'adapt_urban', name: 'Metropole Weaving', description: 'Tailors the movement\'s messaging and activities to thrive in densely populated urban environments. Leverages city infrastructure and networks for faster spread.', cost: 10, icon: Building2, category: 'adaptability', isEvolved: false },
  { id: 'adapt_rural', name: 'Wilds Adaptation', description: 'Adapts the movement to effectively spread and take root in less densely populated rural areas and remote communities. Addresses unique challenges of rural outreach.', cost: 10, icon: Trees, category: 'adaptability', isEvolved: false },
  {
    id: 'adapt_demographic_appeal',
    name: 'Universal Tapestry',
    description: 'Refines the movement to resonate with a wider range of age groups, social classes, and cultural backgrounds. Increases overall potential adoption rate and reduces demographic-specific resistance.',
    cost: 30,
    icon: UserCheck,
    category: 'adaptability',
    isEvolved: false,
    specialAbilityName: "Universal Harmony",
    specialAbilityDescription: "Significantly reduces the baseline resistance generation rate in all influenced regions. Unlocks special 'Unity Dialogue' options during certain global events, potentially converting resistant populations peacefully."
  },
  {
    id: 'adapt_ai_localization',
    name: 'Adaptive Locus AI',
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
    name: 'Resilience Protocol',
    description: 'Establishes protocols, resources, and communication channels to swiftly adapt messaging and support adherents during global crises, maintaining loyalty and preventing spread decline.',
    cost: 30,
    icon: Siren,
    category: 'adaptability',
    isEvolved: false,
    prerequisites: ['adapt_resistance_mgmt']
  },
];

const auroriaSubRegions: SubRegion[] = [
  { id: 'aur_capital', name: 'Luminis Capital', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.92, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.88, mediaFreedom: 0.82, rivalPresence: null },
  { id: 'aur_sunstone', name: 'Solara Fields', adoptionLevel: 0, resistanceLevel: 0.15, economicDevelopment: 0.85, culturalOpenness: 0.65, internetPenetration: 0.88, educationLevel: 0.82, mediaFreedom: 0.78, rivalPresence: null },
  { id: 'aur_heartlands', name: 'Heartwood Commons', adoptionLevel: 0, resistanceLevel: 0.10, economicDevelopment: 0.88, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.80, rivalPresence: null },
  { id: 'aur_azure', name: 'Azure Port Cities', adoptionLevel: 0, resistanceLevel: 0.08, economicDevelopment: 0.95, culturalOpenness: 0.80, internetPenetration: 0.93, educationLevel: 0.90, mediaFreedom: 0.85, rivalPresence: null },
];

const nocturneSubRegions: SubRegion[] = [
  { id: 'noc_shadowfell', name: 'Umbral Citadel', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.85, culturalOpenness: 0.45, internetPenetration: 0.75, educationLevel: 0.78, mediaFreedom: 0.15, rivalPresence: null },
  { id: 'noc_whisperwind', name: 'Zephyr Wastes', adoptionLevel: 0, resistanceLevel: 0.35, economicDevelopment: 0.60, culturalOpenness: 0.30, internetPenetration: 0.45, educationLevel: 0.60, mediaFreedom: 0.10, rivalPresence: null },
  { id: 'noc_ironclad', name: 'Obsidian Marches', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.70, culturalOpenness: 0.35, internetPenetration: 0.65, educationLevel: 0.70, mediaFreedom: 0.12, rivalPresence: null },
  { id: 'noc_gloaming', name: 'Twilight Isles', adoptionLevel: 0, resistanceLevel: 0.28, economicDevelopment: 0.78, culturalOpenness: 0.40, internetPenetration: 0.70, educationLevel: 0.72, mediaFreedom: 0.14, rivalPresence: null },
];

const verdantSubRegions: SubRegion[] = [
  { id: 'ver_riverdelta', name: 'Riverflow Nexus', adoptionLevel: 0, resistanceLevel: 0.22, economicDevelopment: 0.58, culturalOpenness: 0.62, internetPenetration: 0.42, educationLevel: 0.62, mediaFreedom: 0.52, rivalPresence: null },
  { id: 'ver_techclaves', name: 'Synthclave Hubs', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.65, culturalOpenness: 0.68, internetPenetration: 0.48, educationLevel: 0.65, mediaFreedom: 0.55, rivalPresence: null },
  { id: 'ver_spiritpeaks', name: 'Aether Peak Sanctuaries', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.55, culturalOpenness: 0.58, internetPenetration: 0.38, educationLevel: 0.58, mediaFreedom: 0.48, rivalPresence: null },
  { id: 'ver_tradewinds', name: 'Galeborne Coast', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.62, culturalOpenness: 0.65, internetPenetration: 0.45, educationLevel: 0.63, mediaFreedom: 0.53, rivalPresence: null },
];

const solaraSubRegions: SubRegion[] = [
  { id: 'sol_megalopolis', name: 'Radiant Megacity', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.70, culturalOpenness: 0.82, internetPenetration: 0.75, educationLevel: 0.72, mediaFreedom: 0.62, rivalPresence: null },
  { id: 'sol_verdantcoast', name: 'Emerald Coastlands', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.55, culturalOpenness: 0.75, internetPenetration: 0.60, educationLevel: 0.65, mediaFreedom: 0.58, rivalPresence: null },
  { id: 'sol_emeraldheart', name: 'Virescent Wilds', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.45, culturalOpenness: 0.70, internetPenetration: 0.50, educationLevel: 0.60, mediaFreedom: 0.55, rivalPresence: null },
  { id: 'sol_aurorafields', name: 'Dawnlight Farms', adoptionLevel: 0, resistanceLevel: 0.15, economicDevelopment: 0.65, culturalOpenness: 0.78, internetPenetration: 0.68, educationLevel: 0.70, mediaFreedom: 0.60, rivalPresence: null },
];

const aethosSubRegions: SubRegion[] = [
  { id: 'aet_deltacity', name: 'Confluence City', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.50, culturalOpenness: 0.55, internetPenetration: 0.60, educationLevel: 0.55, mediaFreedom: 0.42, rivalPresence: null },
  { id: 'aet_sandsea', name: 'Shifting Sands Outposts', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.30, culturalOpenness: 0.40, internetPenetration: 0.40, educationLevel: 0.45, mediaFreedom: 0.35, rivalPresence: null },
  { id: 'aet_riverbend', name: 'Serpent River Enclave', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.35, culturalOpenness: 0.48, internetPenetration: 0.45, educationLevel: 0.50, mediaFreedom: 0.38, rivalPresence: null },
  { id: 'aet_highlands', name: 'Skyreach Highlands', adoptionLevel: 0, resistanceLevel: 0.28, economicDevelopment: 0.32, culturalOpenness: 0.45, internetPenetration: 0.42, educationLevel: 0.48, mediaFreedom: 0.37, rivalPresence: null },
];

const bastionSubRegions: SubRegion[] = [
  { id: 'bas_rhineforge', name: 'Titanforge Citadel', adoptionLevel: 0, resistanceLevel: 0.08, economicDevelopment: 0.88, culturalOpenness: 0.78, internetPenetration: 0.94, educationLevel: 0.90, mediaFreedom: 0.92, rivalPresence: null },
  { id: 'bas_spreecapitol', name: 'Aegis Capitol', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.80, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.88, rivalPresence: null },
  { id: 'bas_alpenpeaks', name: 'Ironpeak Bastions', adoptionLevel: 0, resistanceLevel: 0.09, economicDevelopment: 0.90, culturalOpenness: 0.76, internetPenetration: 0.93, educationLevel: 0.89, mediaFreedom: 0.91, rivalPresence: null },
  { id: 'bas_hanseatic', name: 'Bulwark Trade Ports', adoptionLevel: 0, resistanceLevel: 0.10, economicDevelopment: 0.85, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.87, mediaFreedom: 0.90, rivalPresence: null },
];

export const INITIAL_COUNTRIES: Country[] = [
  {
    id: 'auroria_prime', name: 'Radiant Republic of Auroria',
    internetPenetration: 0.9, educationLevel: 0.85, economicDevelopment: 0.9,
    culturalOpenness: 0.7, mediaFreedom: 0.8,
    adoptionLevel: 0, resistanceLevel: 0.1, rivalPresence: null,
    subRegions: auroriaSubRegions,
  },
  {
    id: 'umbra_syndicate', name: 'Umbral Syndicate of Noctua',
    internetPenetration: 0.6, educationLevel: 0.7, economicDevelopment: 0.75,
    culturalOpenness: 0.4, mediaFreedom: 0.2,
    adoptionLevel: 0, resistanceLevel: 0.3, rivalPresence: null,
    subRegions: nocturneSubRegions,
  },
  {
    id: 'gaian_confederacy', name: 'Gaian Confederacy of Veridia',
    internetPenetration: 0.4, educationLevel: 0.6, economicDevelopment: 0.6,
    culturalOpenness: 0.6, mediaFreedom: 0.5,
    adoptionLevel: 0, resistanceLevel: 0.2, rivalPresence: null,
    subRegions: verdantSubRegions,
  },
  {
    id: 'solaris_union', name: 'Solaris Union of Helion',
    internetPenetration: 0.7, educationLevel: 0.7, economicDevelopment: 0.65,
    culturalOpenness: 0.8, mediaFreedom: 0.6,
    adoptionLevel: 0, resistanceLevel: 0.15, rivalPresence: null,
    subRegions: solaraSubRegions,
  },
  {
    id: 'aethelgard_dominion', name: 'Ancient Dominion of Aethelgard',
    internetPenetration: 0.5, educationLevel: 0.5, economicDevelopment: 0.4,
    culturalOpenness: 0.5, mediaFreedom: 0.4,
    adoptionLevel: 0, resistanceLevel: 0.25, rivalPresence: null,
    subRegions: aethosSubRegions,
  },
  {
    id: 'fortress_states', name: 'Fortress States of Bastion',
    internetPenetration: 0.92, educationLevel: 0.88, economicDevelopment: 0.85,
    culturalOpenness: 0.75, mediaFreedom: 0.9,
    adoptionLevel: 0, resistanceLevel: 0.1, rivalPresence: null,
    subRegions: bastionSubRegions,
  },
];

export const STARTING_INFLUENCE_POINTS = 50;

export const countryPositions: Record<string, { top: string; left: string }> = {
  auroria_prime: { top: '30%', left: '20%' },
  umbra_syndicate: { top: '35%', left: '75%' },
  gaian_confederacy: { top: '55%', left: '60%' }, 
  solaris_union: { top: '70%', left: '30%' },
  aethelgard_dominion: { top: '50%', left: '40%' }, 
  fortress_states: { top: '25%', left: '50%' },
};

export const subRegionPositions: Record<string, { offsets: {top: string; left: string}[] }> = {
  auroria_prime: {
    offsets: [ { top: '-10%', left: '-10%' }, { top: '10%', left: '-8%' }, { top: '-8%', left: '10%' }, { top: '8%', left: '12%' } ],
  },
  umbra_syndicate: {
    offsets: [ { top: '-9%', left: '-8%' }, { top: '9%', left: '-10%' }, { top: '0%', left: '9%' }, { top: '10%', left: '7%' } ],
  },
  gaian_confederacy: {
    offsets: [ { top: '-9%', left: '0%' }, { top: '8%', left: '-9%' }, { top: '8%', left: '9%' }, { top: '12%', left: '0%' } ],
  },
  solaris_union: {
    offsets: [ { top: '-9%', left: '-7%' }, { top: '8%', left: '-9%' }, { top: '0%', left: '10%' }, { top: '10%', left: '7%' } ],
  },
  aethelgard_dominion: {
    offsets: [ { top: '-8%', left: '-8%' }, { top: '8%', left: '0%' }, { top: '-7%', left: '9%' }, { top: '9%', left: '8%' } ],
  },
  fortress_states: {
    offsets: [ { top: '-9%', left: '-7%' }, { top: '9%', left: '0%' }, { top: '0%', left: '9%' }, { top: '-8%', left: '10%'} ],
  },
};


export const POTENTIAL_GLOBAL_EVENTS: GlobalEvent[] = [
  {
    id: 'global_internet_renaissance',
    name: 'Aetheric Web Expansion',
    description: 'A wave of new infrastructure and accessibility sweeps the globe, making online communication easier and fostering openness.',
    turnStart: 3,
    duration: 5,
    effects: [
      { targetType: 'global', property: 'culturalOpenness', value: 0.05, isMultiplier: false },
      { targetType: 'global', property: 'adoptionRateModifier', value: 1.1, isMultiplier: true }
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'economic_crisis_umbra',
    name: 'Umbral Economic Downturn',
    description: 'The Umbral Syndicate faces an unexpected economic downturn, leading to social unrest and a re-evaluation of priorities. How do you leverage this?',
    turnStart: 6,
    duration: 4,
    effects: [], // Base effects are replaced by chosen option
    options: [
      {
        id: 'crisis_invest_umbra',
        text: 'Invest in Cultural Outreach (Cost: 20 IP)',
        description: 'Launch targeted campaigns in Umbra, hoping to offer solace and new perspectives. Reduces resistance slightly, small adoption boost in Umbra, but costs IP.',
        effects: [
          { targetType: 'country', countryId: 'umbra_syndicate', property: 'resistanceLevel', value: -0.03, isMultiplier: false },
          { targetType: 'country', countryId: 'umbra_syndicate', property: 'adoptionRateModifier', value: 1.05, isMultiplier: true },
          { targetType: 'global', property: 'ipBonus', value: -20, isMultiplier: false }, // Cost
        ],
      },
      {
        id: 'crisis_focus_elsewhere_umbra',
        text: 'Focus Efforts Elsewhere',
        description: 'Avoid entanglement in Umbra\'s crisis and focus your resources on more stable regions. Slight global adoption boost due to focused efforts.',
        effects: [
          { targetType: 'global', property: 'adoptionRateModifier', value: 1.03, isMultiplier: true },
        ],
      },
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'international_harmony_prize',
    name: 'Global Harmony Laureate',
    description: 'Your cultural movement is recognized with a prestigious Global Harmony Prize, boosting its legitimacy and granting IP.',
    turnStart: 10,
    duration: 1, // Lasts for the turn it's awarded
    effects: [
      { targetType: 'global', property: 'ipBonus', value: 50, isMultiplier: false },
      { targetType: 'global', property: 'resistanceLevel', value: -0.02, isMultiplier: false } // Global resistance reduction
    ],
    hasBeenTriggered: false,
  },
   {
    id: 'global_tech_symposium',
    name: 'Global Tech Symposium',
    description: 'A major technology symposium showcases new digital tools, temporarily boosting digital adoption globally.',
    turnStart: 4,
    duration: 2,
    effects: [
      { targetType: 'global', property: 'adoptionRateModifier', value: 1.05, isMultiplier: true },
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'cultural_nexus_bastion',
    name: 'Bastion Cultural Nexus',
    description: 'The Fortress States hosts a global cultural festival, increasing its openness to new ideas and expressions.',
    turnStart: 9,
    duration: 3,
    effects: [
      { targetType: 'country', countryId: 'fortress_states', property: 'culturalOpenness', value: 0.15, isMultiplier: false },
      { targetType: 'country', countryId: 'fortress_states', property: 'adoptionRateModifier', value: 1.1, isMultiplier: true },
    ],
    hasBeenTriggered: false,
  }
];

export const RIVAL_MOVEMENTS: RivalMovement[] = [
  {
    id: 'order_of_the_cog',
    name: 'Order of the Cog',
    icon: Bot, 
    color: '#718096', // Slate Gray
    startingCountryId: 'umbra_syndicate', 
    aggressiveness: 0.5, // More cautious
    personality: 'CautiousConsolidator',
    focus: 'resistance', 
  },
  {
    id: 'siren_song_syndicate',
    name: 'Siren Song Syndicate',
    icon: Pyramid, 
    color: '#b794f4', // Purple
    startingCountryId: 'solaris_union', 
    aggressiveness: 0.7, // More aggressive
    personality: 'AggressiveExpansionist',
    focus: 'spread', 
  },
];
