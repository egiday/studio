import type { LucideIcon } from 'lucide-react';

export interface CulturalMovement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
}

export interface EvolutionCategory {
  id: string;
  name: string;
  description?: string;
}

export interface EvolutionItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: LucideIcon;
  category: string; // ID of EvolutionCategory
  isEvolved: boolean;
  prerequisites?: string[]; // IDs of other EvolutionItems
}

export interface Country {
  id: string;
  name: string;
  internetPenetration: number; // 0-1
  educationLevel: number; // 0-1
  economicDevelopment: number; // 0-1
  culturalOpenness: number; // 0-1
  mediaFreedom: number; // 0-1
  adoptionLevel: number; // 0-1, dynamic
  resistanceLevel: number; // 0-1, dynamic
}

export interface NewsHeadline {
  id: string;
  text: string;
  timestamp: number;
}
