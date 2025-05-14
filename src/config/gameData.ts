
import type { CulturalMovement, EvolutionItem, EvolutionCategory, Country } from '@/types';
import { Cpu, Palette, Brain, Users, FlaskConical, Ticket, School, Sparkles, Zap, MessageSquare, UsersRound, Tv, Hand, Rss, Merge, DollarSign, ShieldAlert, Globe, Building2, UserCheck, Siren, CloudCog, BrainCog, Lightbulb, Speech, GitFork, Trees, MountainSnow, Factory, Film } from 'lucide-react';

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

export const INITIAL_COUNTRIES: Country[] = [
  { id: 'usa', name: 'USA', internetPenetration: 0.9, educationLevel: 0.85, economicDevelopment: 0.9, culturalOpenness: 0.7, mediaFreedom: 0.8, adoptionLevel: 0, resistanceLevel: 0.1 },
  { id: 'china', name: 'China', internetPenetration: 0.6, educationLevel: 0.7, economicDevelopment: 0.75, culturalOpenness: 0.4, mediaFreedom: 0.2, adoptionLevel: 0, resistanceLevel: 0.3 },
  { id: 'india', name: 'India', internetPenetration: 0.4, educationLevel: 0.6, economicDevelopment: 0.6, culturalOpenness: 0.6, mediaFreedom: 0.5, adoptionLevel: 0, resistanceLevel: 0.2 },
  { id: 'brazil', name: 'Brazil', internetPenetration: 0.7, educationLevel: 0.7, economicDevelopment: 0.65, culturalOpenness: 0.8, mediaFreedom: 0.6, adoptionLevel: 0, resistanceLevel: 0.15 },
  { id: 'nigeria', name: 'Nigeria', internetPenetration: 0.5, educationLevel: 0.5, economicDevelopment: 0.4, culturalOpenness: 0.5, mediaFreedom: 0.4, adoptionLevel: 0, resistanceLevel: 0.25 },
  { id: 'germany', name: 'Germany', internetPenetration: 0.92, educationLevel: 0.88, economicDevelopment: 0.85, culturalOpenness: 0.75, mediaFreedom: 0.9, adoptionLevel: 0, resistanceLevel: 0.1 },
];

export const STARTING_INFLUENCE_POINTS = 50;
