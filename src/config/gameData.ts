
import type { CulturalMovement, EvolutionItem, EvolutionCategory, Country, SubRegion, GlobalEvent, RivalMovement } from '@/types';
import { Cpu, Palette, Brain, Users, FlaskConical, Ticket, School, Sparkles, Zap, MessageSquare, UsersRound, Tv, Hand, Rss, Merge, DollarSign, ShieldAlert, Globe, Building2, UserCheck, Siren, CloudCog, BrainCog, Lightbulb, Speech, GitFork, Trees, MountainSnow, Factory, Film, Award, Megaphone, TrendingUp, Bot, Pyramid, Handshake, Feather, ShieldCheck, TowerControl, Rocket, Orbit, SunMedium } from 'lucide-react';

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

// Costs reduced by ~40-60%
export const EVOLUTION_ITEMS: EvolutionItem[] = [
  // Expression Methods
  { id: 'expr_social_media', name: 'Subspace Network Presence', description: 'Establishes a basic interstellar network presence, allowing for wider reach and faster initial spread in connected systems.', cost: 40, icon: MessageSquare, category: 'expression_methods', isEvolved: false },
  { id: 'expr_apps', name: 'Resonance Beacon App', description: 'Develops a dedicated application for your movement, fostering a unified community across planets. Boosts engagement in systems with high personal device penetration.', cost: 75, icon: Zap, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media'] },
  { id: 'expr_gatherings', name: 'Starport Rallies', description: 'Organizes local gatherings at major starports and settlements, strengthening community bonds and increasing adoption. Effective in diverse planetary environments.', cost: 60, icon: UsersRound, category: 'expression_methods', isEvolved: false },
  { id: 'expr_media_broadcast', name: 'Galactic HoloNet Broadcasts', description: 'Gains presence on established HoloNet channels. Significantly increases awareness across many systems, bypassing local network limitations.', cost: 110, icon: Tv, category: 'expression_methods', isEvolved: false },
  { id: 'expr_word_of_mouth', name: 'Stellar Courier Network', description: 'Empowers individuals to share the movement through personal FTL comms and travel. Provides a slow but resilient form of spread.', cost: 35, icon: Hand, category: 'expression_methods', isEvolved: false },
  { id: 'expr_influencers', name: 'Echo Chamber Cultivators', description: 'Collaborates with popular HoloNet personalities and sector-wide thought leaders to promote the movement. Highly effective for reaching specific demographics and accelerating network adoption.', cost: 90, icon: Rss, category: 'expression_methods', isEvolved: false, prerequisites: ['expr_social_media']},
  {
    id: 'expr_viral_studio',
    name: 'Ephemeral Holo-Art Studio',
    description: 'Creates a dedicated team for producing high-quality, engaging, and shareable Holo-content tailored for interstellar networks. Significantly boosts spread rate.',
    cost: 150, // was 300
    icon: Film,
    category: 'expression_methods',
    isEvolved: false,
    prerequisites: ['expr_apps', 'expr_influencers'],
    specialAbilityName: "Cultural Resonance Burst",
    specialAbilityDescription: "Content produced by the studio is 20% more effective at increasing adoption. Additionally, there's a chance each turn to trigger a 'Viral Signal' mini-event, granting bonus Influence Points."
  },
  {
    id: 'expr_grassroots_kits',
    name: 'Colony Seed Kits',
    description: 'Provides toolkits, funding, and training for local planetary leaders to independently organize events and promote the movement, enhancing local adoption.',
    cost: 100, // was 200
    icon: Megaphone,
    category: 'expression_methods',
    isEvolved: false,
    prerequisites: ['expr_word_of_mouth', 'expr_gatherings']
  },
  {
    id: 'expr_global_syndication',
    name: 'Universal Signal Network',
    description: 'Establishes partnerships to distribute cultural content through major interstellar media networks, creating a persistent galactic presence.',
    cost: 180, // was 375
    icon: TrendingUp,
    category: 'expression_methods',
    isEvolved: false,
    prerequisites: ['expr_media_broadcast', 'expr_viral_studio'],
    specialAbilityName: "Omnipresent Signal",
    specialAbilityDescription: "All network-based expressions (HoloNet, Studio) become 15% more effective. Reduces cost of future network-related evolutions by 10%."
  },

  // Cultural Elements
  { id: 'elem_aesthetic_style', name: 'Signature Stellar Aesthetics', description: 'Defines a unique and recognizable aesthetic for the movement, including symbols, color schemes, and starship designs. Increases appeal and memorability.', cost: 45, icon: Palette, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_rituals', name: 'Celestial Convergence Rituals', description: 'Establishes shared practices or system-wide events that reinforce the movement\'s values and build community cohesion. Deepens engagement among adherents.', cost: 70, icon: Sparkles, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_value_system', name: 'Galactic Principles Codex', description: 'Articulates a clear set of guiding principles for the movement. Provides intellectual and moral grounding.', cost: 85, icon: BrainCog, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_language', name: 'Unifying Star-Tongue', description: 'Develops specialized vocabulary or a simplified common language unique to the movement. Fosters a sense of in-group identity.', cost: 60, icon: Speech, category: 'cultural_elements', isEvolved: false },
  { id: 'elem_concepts', name: 'Core Cosmic Axioms', description: 'Introduces novel ideas or philosophies that form the intellectual core of the movement. Essential for movements focused on thought or science.', cost: 90, icon: Lightbulb, category: 'cultural_elements', isEvolved: false },
  {
    id: 'elem_mythology_lore',
    name: 'Astro-Mythos Weaving',
    description: 'Develops a rich tapestry of stories, myths, and legendary figures that deepen the cultural narrative and emotional connection for adherents across star systems.',
    cost: 110, // was 225
    icon: Orbit,
    category: 'cultural_elements',
    isEvolved: false,
    prerequisites: ['elem_value_system', 'elem_concepts']
  },
  {
    id: 'elem_interactive_education',
    name: 'Noosphere Simulation Platform',
    description: 'Creates an interstellar network platform with courses and interactive simulations about the movement\'s core tenets, boosting retention and understanding.',
    cost: 135, // was 270
    icon: School,
    category: 'cultural_elements',
    isEvolved: false,
    prerequisites: ['elem_concepts', 'expr_apps']
  },

  // Adaptability
  { id: 'adapt_integration', name: 'Xeno-Cultural Symbiosis', description: 'Develops methods to blend the movement with existing planetary customs and xeno-cultures. Reduces cultural friction in diverse systems.', cost: 75, icon: Merge, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resource_eff', name: 'Resource-Lean Propagation', description: 'Optimizes the resources needed for individuals to adopt and participate, making it more accessible in systems with varied resource levels.', cost: 70, icon: DollarSign, category: 'adaptability', isEvolved: false },
  { id: 'adapt_resistance_mgmt', name: 'Discord Dampening Fields', description: 'Implements strategies to understand, address, and counter opposing viewpoints and organized resistance across systems.', cost: 100, icon: ShieldAlert, category: 'adaptability', isEvolved: false },
  { id: 'adapt_urban', name: 'Core World Integration', description: 'Tailors the movement\'s messaging to thrive in densely populated core worlds and ecumenopolises. Leverages complex infrastructure for faster spread.', cost: 55, icon: Building2, category: 'adaptability', isEvolved: false },
  { id: 'adapt_rural', name: 'Outer Rim Adaptation', description: 'Adapts the movement to effectively spread in sparsely populated outer rim planets and remote colonies.', cost: 55, icon: Rocket, category: 'adaptability', isEvolved: false },
  {
    id: 'adapt_demographic_appeal',
    name: 'Universal Tapestry Weaving',
    description: 'Refines the movement to resonate with a wider range of species, age groups, and socio-economic strata across the galaxy. Increases overall potential adoption.',
    cost: 120, // was 240
    icon: UserCheck,
    category: 'adaptability',
    isEvolved: false,
    specialAbilityName: "Galactic Harmony Protocol",
    specialAbilityDescription: "Significantly reduces baseline resistance generation in all influenced systems. Unlocks special 'Unity Concord' options during certain galactic events."
  },
  {
    id: 'adapt_ai_localization',
    name: 'Adaptive Xenolinguistics AI',
    description: 'Utilizes advanced AI to rapidly translate and culturally adapt content for diverse alien languages and planetary nuances, dramatically increasing integration speed.',
    cost: 160, // was 330
    icon: GitFork,
    category: 'adaptability',
    isEvolved: false,
    prerequisites: ['adapt_integration', 'expr_apps'],
    specialAbilityName: "Hyper-Adaptation Matrix",
    specialAbilityDescription: "Reduces cultural resistance penalties arising from planetary differences by 50%. Automatically translates basic communications to any known species."
  },
  {
    id: 'adapt_crisis_protocol',
    name: 'Stellar Resilience Protocol',
    description: 'Establishes protocols and communication channels to swiftly adapt messaging and support adherents during galactic crises, maintaining loyalty.',
    cost: 110, // was 225
    icon: Siren,
    category: 'adaptability',
    isEvolved: false,
    prerequisites: ['adapt_resistance_mgmt']
  },
];

// Solar Systems and their Planets
const solaraPrimeSystemPlanets: SubRegion[] = [
  { id: 'sp_terra_nova', name: 'Terra Nova', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.92, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.88, mediaFreedom: 0.82, rivalPresences: [] },
  { id: 'sp_ignis', name: 'Ignis IV', adoptionLevel: 0, resistanceLevel: 0.15, economicDevelopment: 0.85, culturalOpenness: 0.65, internetPenetration: 0.88, educationLevel: 0.82, mediaFreedom: 0.78, rivalPresences: [] },
  { id: 'sp_aquilon', name: 'Aquilon Belt', adoptionLevel: 0, resistanceLevel: 0.10, economicDevelopment: 0.88, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.80, rivalPresences: [] },
  { id: 'sp_luxoria', name: 'Luxoria Prime', adoptionLevel: 0, resistanceLevel: 0.08, economicDevelopment: 0.95, culturalOpenness: 0.80, internetPenetration: 0.93, educationLevel: 0.90, mediaFreedom: 0.85, rivalPresences: [] },
];

const kryllNexusPlanets: SubRegion[] = [
  { id: 'kn_voidfang_citadel', name: 'Voidfang Citadel', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.85, culturalOpenness: 0.45, internetPenetration: 0.75, educationLevel: 0.78, mediaFreedom: 0.15, rivalPresences: [] },
  { id: 'kn_whisperwind_depths', name: 'Whisperwind Depths', adoptionLevel: 0, resistanceLevel: 0.35, economicDevelopment: 0.60, culturalOpenness: 0.30, internetPenetration: 0.45, educationLevel: 0.60, mediaFreedom: 0.10, rivalPresences: [] },
  { id: 'kn_ironclad_moons', name: 'Ironclad Moons', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.70, culturalOpenness: 0.35, internetPenetration: 0.65, educationLevel: 0.70, mediaFreedom: 0.12, rivalPresences: [] },
  { id: 'kn_shadowfen_worlds', name: 'Shadowfen Worlds', adoptionLevel: 0, resistanceLevel: 0.28, economicDevelopment: 0.78, culturalOpenness: 0.40, internetPenetration: 0.70, educationLevel: 0.72, mediaFreedom: 0.14, rivalPresences: [] },
];

const orionisClusterPlanets: SubRegion[] = [
  { id: 'oc_veridia_prime', name: 'Veridia Prime', adoptionLevel: 0, resistanceLevel: 0.22, economicDevelopment: 0.58, culturalOpenness: 0.62, internetPenetration: 0.42, educationLevel: 0.62, mediaFreedom: 0.52, rivalPresences: [] },
  { id: 'oc_technos_core', name: 'Technos Core', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.65, culturalOpenness: 0.68, internetPenetration: 0.48, educationLevel: 0.65, mediaFreedom: 0.55, rivalPresences: [] },
  { id: 'oc_aetheria_wilds', name: 'Aetheria Wilds', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.55, culturalOpenness: 0.58, internetPenetration: 0.38, educationLevel: 0.58, mediaFreedom: 0.48, rivalPresences: [] },
  { id: 'oc_ember_reach', name: 'Ember Reach', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.62, culturalOpenness: 0.65, internetPenetration: 0.45, educationLevel: 0.63, mediaFreedom: 0.53, rivalPresences: [] },
];

const cygnusArmPlanets: SubRegion[] = [
  { id: 'ca_nova_cygni', name: 'Nova Cygni Hub', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.70, culturalOpenness: 0.82, internetPenetration: 0.75, educationLevel: 0.72, mediaFreedom: 0.62, rivalPresences: [] },
  { id: 'ca_azure_nebula', name: 'Azure Nebula Colonies', adoptionLevel: 0, resistanceLevel: 0.18, economicDevelopment: 0.55, culturalOpenness: 0.75, internetPenetration: 0.60, educationLevel: 0.65, mediaFreedom: 0.58, rivalPresences: [] },
  { id: 'ca_frontier_worlds', name: 'Frontier Worlds Expanse', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.45, culturalOpenness: 0.70, internetPenetration: 0.50, educationLevel: 0.60, mediaFreedom: 0.55, rivalPresences: [] },
  { id: 'ca_helios_gate', name: 'Helios Gate Station', adoptionLevel: 0, resistanceLevel: 0.15, economicDevelopment: 0.65, culturalOpenness: 0.78, internetPenetration: 0.68, educationLevel: 0.70, mediaFreedom: 0.60, rivalPresences: [] },
];

const hadesRimPlanets: SubRegion[] = [
  { id: 'hr_styx_terminus', name: 'Styx Terminus', adoptionLevel: 0, resistanceLevel: 0.20, economicDevelopment: 0.50, culturalOpenness: 0.55, internetPenetration: 0.60, educationLevel: 0.55, mediaFreedom: 0.42, rivalPresences: [] },
  { id: 'hr_acheron_void', name: 'Acheron Void Outposts', adoptionLevel: 0, resistanceLevel: 0.30, economicDevelopment: 0.30, culturalOpenness: 0.40, internetPenetration: 0.40, educationLevel: 0.45, mediaFreedom: 0.35, rivalPresences: [] },
  { id: 'hr_lethe_drifts', name: 'Lethe Drifts', adoptionLevel: 0, resistanceLevel: 0.25, economicDevelopment: 0.35, culturalOpenness: 0.48, internetPenetration: 0.45, educationLevel: 0.50, mediaFreedom: 0.38, rivalPresences: [] },
  { id: 'hr_tartarus_deep', name: 'Tartarus Deep Colonies', adoptionLevel: 0, resistanceLevel: 0.28, economicDevelopment: 0.32, culturalOpenness: 0.45, internetPenetration: 0.42, educationLevel: 0.48, mediaFreedom: 0.37, rivalPresences: [] },
];

const elysianFieldsPlanets: SubRegion[] = [
  { id: 'ef_elysium_core', name: 'Elysium Core', adoptionLevel: 0, resistanceLevel: 0.08, economicDevelopment: 0.88, culturalOpenness: 0.78, internetPenetration: 0.94, educationLevel: 0.90, mediaFreedom: 0.92, rivalPresences: [] },
  { id: 'ef_arcadia_sphere', name: 'Arcadia Sphere', adoptionLevel: 0, resistanceLevel: 0.12, economicDevelopment: 0.80, culturalOpenness: 0.70, internetPenetration: 0.90, educationLevel: 0.85, mediaFreedom: 0.88, rivalPresences: [] },
  { id: 'ef_olympus_heights', name: 'Olympus Heights', adoptionLevel: 0, resistanceLevel: 0.09, economicDevelopment: 0.90, culturalOpenness: 0.76, internetPenetration: 0.93, educationLevel: 0.89, mediaFreedom: 0.91, rivalPresences: [] },
  { id: 'ef_celestial_gardens', name: 'Celestial Gardens', adoptionLevel: 0, resistanceLevel: 0.10, economicDevelopment: 0.85, culturalOpenness: 0.75, internetPenetration: 0.92, educationLevel: 0.87, mediaFreedom: 0.90, rivalPresences: [] },
];


export const INITIAL_COUNTRIES: Country[] = [
  {
    id: 'solara_prime_system', name: 'Solara Prime System',
    internetPenetration: 0.9, educationLevel: 0.85, economicDevelopment: 0.9,
    culturalOpenness: 0.7, mediaFreedom: 0.8,
    adoptionLevel: 0, resistanceLevel: 0.1, rivalPresences: [],
    subRegions: solaraPrimeSystemPlanets,
  },
  {
    id: 'kryll_nexus', name: 'Kryll Nexus',
    internetPenetration: 0.6, educationLevel: 0.7, economicDevelopment: 0.75,
    culturalOpenness: 0.4, mediaFreedom: 0.2,
    adoptionLevel: 0, resistanceLevel: 0.3, rivalPresences: [],
    subRegions: kryllNexusPlanets,
  },
  {
    id: 'orionis_cluster', name: 'Orionis Cluster',
    internetPenetration: 0.4, educationLevel: 0.6, economicDevelopment: 0.6,
    culturalOpenness: 0.6, mediaFreedom: 0.5,
    adoptionLevel: 0, resistanceLevel: 0.2, rivalPresences: [],
    subRegions: orionisClusterPlanets,
  },
  {
    id: 'cygnus_arm_confederation', name: 'Cygnus Arm Confederation',
    internetPenetration: 0.7, educationLevel: 0.7, economicDevelopment: 0.65,
    culturalOpenness: 0.8, mediaFreedom: 0.6,
    adoptionLevel: 0, resistanceLevel: 0.15, rivalPresences: [],
    subRegions: cygnusArmPlanets,
  },
  {
    id: 'hades_rim_dominion', name: 'Hades Rim Dominion',
    internetPenetration: 0.5, educationLevel: 0.5, economicDevelopment: 0.4,
    culturalOpenness: 0.5, mediaFreedom: 0.4,
    adoptionLevel: 0, resistanceLevel: 0.25, rivalPresences: [],
    subRegions: hadesRimPlanets,
  },
  {
    id: 'elysian_fields_alliance', name: 'Elysian Fields Alliance',
    internetPenetration: 0.92, educationLevel: 0.88, economicDevelopment: 0.85,
    culturalOpenness: 0.75, mediaFreedom: 0.9,
    adoptionLevel: 0, resistanceLevel: 0.1, rivalPresences: [],
    subRegions: elysianFieldsPlanets,
  },
];

export const STARTING_INFLUENCE_POINTS = 50;

export const systemPositions: Record<string, { top: string; left: string }> = {
  solara_prime_system: { top: '30%', left: '20%' },
  kryll_nexus: { top: '35%', left: '75%' },
  orionis_cluster: { top: '55%', left: '60%' },
  cygnus_arm_confederation: { top: '70%', left: '30%' },
  hades_rim_dominion: { top: '50%', left: '40%' },
  elysian_fields_alliance: { top: '25%', left: '50%' },
};

export const planetPositions: Record<string, { offsets: {top: string; left: string}[] }> = {
  solara_prime_system: { offsets: [ { top: '-12%', left: '-15%' }, { top: '12%', left: '-13%' }, { top: '-10%', left: '15%' }, { top: '10%', left: '17%' } ] },
  kryll_nexus: { offsets: [ { top: '-11%', left: '-12%' }, { top: '11%', left: '-14%' }, { top: '-2%', left: '13%' }, { top: '12%', left: '11%' } ] },
  orionis_cluster: { offsets: [ { top: '-11%', left: '-3%' }, { top: '10%', left: '-12%' }, { top: '10%', left: '12%' }, { top: '14%', left: '2%' } ] },
  cygnus_arm_confederation: { offsets: [ { top: '-11%', left: '-10%' }, { top: '10%', left: '-12%' }, { top: '-1%', left: '14%' }, { top: '12%', left: '11%' } ] },
  hades_rim_dominion: { offsets: [ { top: '-10%', left: '-11%' }, { top: '10%', left: '-3%' }, { top: '-9%', left: '13%' }, { top: '11%', left: '12%' } ] },
  elysian_fields_alliance: { offsets: [ { top: '-11%', left: '-10%' }, { top: '11%', left: '-2%' }, { top: '-1%', left: '13%' }, { top: '-10%', left: '14%'} ] },
};

export const POTENTIAL_GLOBAL_EVENTS: GlobalEvent[] = [
  {
    id: 'galactic_hypernet_upgrade',
    name: 'HyperNet Bandwidth Surge',
    description: 'A galactic infrastructure upgrade dramatically increases HyperNet speed and accessibility, fostering openness.',
    turnStart: 3,
    duration: 5,
    effects: [
      { targetType: 'global', property: 'culturalOpenness', value: 0.05, isMultiplier: false },
      { targetType: 'global', property: 'adoptionRateModifier', value: 1.1, isMultiplier: true }
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'economic_crisis_kryll_nexus',
    name: 'Kryll Nexus Resource Crash',
    description: 'The Kryll Nexus faces an unexpected resource shortage, leading to system-wide unrest. How do you respond?',
    turnStart: 6,
    duration: 4,
    effects: [], // Base effects are empty as options define outcomes
    options: [
      {
        id: 'crisis_invest_kryll',
        text: 'Deploy Cultural Aid (Cost: 20 IP)',
        description: 'Launch targeted cultural outreach programs in the Kryll Nexus, offering new perspectives. Reduces resistance, small adoption boost, costs IP.',
        effects: [
          { targetType: 'country', countryId: 'kryll_nexus', property: 'resistanceLevel', value: -0.03, isMultiplier: false },
          { targetType: 'country', countryId: 'kryll_nexus', property: 'adoptionRateModifier', value: 1.05, isMultiplier: true },
          { targetType: 'global', property: 'ipBonus', value: -20, isMultiplier: false },
        ],
      },
      {
        id: 'crisis_focus_elsewhere_kryll',
        text: 'Focus Efforts on Stable Systems',
        description: 'Avoid entanglement in the Kryll Nexus crisis and focus resources on more stable systems. Slight galactic adoption boost.',
        effects: [
          { targetType: 'global', property: 'adoptionRateModifier', value: 1.03, isMultiplier: true },
        ],
      },
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'galactic_peace_prize',
    name: 'Galactic Harmony Laureate',
    description: 'Your cultural movement is recognized with a prestigious Galactic Harmony Prize, boosting its legitimacy and granting IP.',
    turnStart: 10,
    duration: 1,
    effects: [
      { targetType: 'global', property: 'ipBonus', value: 50, isMultiplier: false },
      { targetType: 'global', property: 'resistanceLevel', value: -0.02, isMultiplier: false }
    ],
    hasBeenTriggered: false,
  },
   {
    id: 'interstellar_tech_expo',
    name: 'Interstellar Tech Expo',
    description: 'A major tech expo showcases new FTL communication tools, temporarily boosting digital adoption across the galaxy.',
    turnStart: 4,
    duration: 2,
    effects: [
      { targetType: 'global', property: 'adoptionRateModifier', value: 1.05, isMultiplier: true },
    ],
    hasBeenTriggered: false,
  },
  {
    id: 'elysian_cultural_festival',
    name: 'Elysian Grand Festival',
    description: 'The Elysian Fields Alliance hosts a galaxy-wide cultural festival, increasing its openness to new ideas.',
    turnStart: 9,
    duration: 3,
    effects: [
      { targetType: 'country', countryId: 'elysian_fields_alliance', property: 'culturalOpenness', value: 0.15, isMultiplier: false },
      { targetType: 'country', countryId: 'elysian_fields_alliance', property: 'adoptionRateModifier', value: 1.1, isMultiplier: true },
    ],
    hasBeenTriggered: false,
  }
];

export const RIVAL_MOVEMENTS: RivalMovement[] = [
  {
    id: 'order_of_the_cog',
    name: 'Techno-Organic Purity (Cog)',
    icon: Bot,
    color: '#718096',
    startingCountryId: 'kryll_nexus',
    aggressiveness: 0.6,
    personality: 'CautiousConsolidator',
    playerStance: 'Hostile',
    influencePoints: 25,
    evolvedItemIds: new Set(),
  },
  {
    id: 'siren_song_syndicate',
    name: 'Void Siren Syndicate',
    icon: Pyramid,
    color: '#b794f4',
    startingCountryId: 'cygnus_arm_confederation',
    aggressiveness: 0.75,
    personality: 'AggressiveExpansionist',
    playerStance: 'Hostile',
    influencePoints: 25,
    evolvedItemIds: new Set(),
  },
  {
    id: 'silent_hand_cabal',
    name: 'The Shadow Hand Collective',
    icon: Feather,
    color: '#527a7a',
    startingCountryId: 'hades_rim_dominion',
    aggressiveness: 0.55,
    personality: 'OpportunisticInfiltrator',
    playerStance: 'Neutral',
    influencePoints: 30,
    evolvedItemIds: new Set(),
  },
  {
    id: 'aegis_protectorate',
    name: 'Solar Aegis Mandate',
    icon: ShieldCheck,
    color: '#4a69bd',
    startingCountryId: 'elysian_fields_alliance',
    aggressiveness: 0.4,
    personality: 'IsolationistDefender',
    playerStance: 'Neutral',
    influencePoints: 35,
    evolvedItemIds: new Set(),
  },
  {
    id: 'chrono_conservators',
    name: 'Stellar Conservators Guild',
    icon: TowerControl,
    color: '#8B4513',
    startingCountryId: 'orionis_cluster',
    aggressiveness: 0.8,
    personality: 'ZealousPurifier',
    playerStance: 'Hostile',
    influencePoints: 20,
    evolvedItemIds: new Set(),
  },
];
