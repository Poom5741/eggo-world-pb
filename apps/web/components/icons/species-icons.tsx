"use client"

/**
 * Species Icons — Centralized icon mapper for all species, food items, and status indicators.
 * Replaces hardcoded emoji characters with Lucide React icons for consistency and accessibility.
 */

import {
  Flame,
  Star,
  Trophy,
  Sparkles,
  AlertTriangle,
  Egg,
  Users,
  DollarSign,
  Wheat,
  Fish,
  Bug,
  Leaf,
  PawPrint,
  Bird,
} from "lucide-react"

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SpeciesType =
  | "Chicken"
  | "Duck"
  | "Pig"
  | "Cow"
  | "Sheep"
  | "Dog"
  | "Cat"
  | "Rabbit"
  // Extended species for HatchReveal compatibility
  | "Quail"
  | "Peacock"
  | "Swan"
  | "Turkey"
  | "Phoenix"
  | "Dragon"
  | "Unicorn"
  | "Gryphon"

export type FoodType = "Wheat" | "Fish" | "Bug" | "Leaf"

export type StatusType =
  | "hatching"
  | "ready"
  | "locked"
  | "featured"
  | "breeding"
  | "completed"

// ============================================================================
// ICON MAPPINGS — Lucide icon components by category
// ============================================================================

export const SPECIES_ICONS: Record<SpeciesType, React.ComponentType<{ className?: string }>> = {
  Chicken: Flame,
  Duck: Star,
  Pig: Trophy,
  Cow: Sparkles,
  Sheep: Egg,
  Dog: PawPrint,
  Cat: Users,
  Rabbit: DollarSign,
  // Extended species for HatchReveal compatibility
  Quail: Bird,
  Peacock: Trophy,
  Swan: Egg,
  Turkey: Flame,
  Phoenix: Flame,
  Dragon: Sparkles,
  Unicorn: Star,
  Gryphon: Bird,
}

export const FOOD_ICONS: Record<FoodType, React.ComponentType<{ className?: string }>> = {
  Wheat: Wheat,
  Fish: Fish,
  Bug: Bug,
  Leaf: Leaf,
}

export const STATUS_ICONS: Record<StatusType, React.ComponentType<{ className?: string }>> = {
  hatching: Sparkles,
  ready: Trophy,
  locked: AlertTriangle,
  featured: Star,
  breeding: Flame,
  completed: Egg,
}

// ============================================================================
// DYNAMIC ICON COMPONENTS
// ============================================================================

interface SpeciesIconProps {
  species: SpeciesType
  className?: string
  size?: "sm" | "md" | "lg"
}

const SIZE_MAP: Record<NonNullable<SpeciesIconProps["size"]>, string> = {
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-6 h-6",
}

export function SpeciesIcon({ species, className = "", size = "md" }: SpeciesIconProps) {
  const IconComponent = SPECIES_ICONS[species] || Sparkles
  return <IconComponent className={`${SIZE_MAP[size]} ${className}`} aria-hidden="true" />
}

interface FoodIconProps {
  food: FoodType
  className?: string
  size?: "sm" | "md" | "lg"
}

export function FoodIcon({ food, className = "", size = "md" }: FoodIconProps) {
  const IconComponent = FOOD_ICONS[food] || Leaf
  return <IconComponent className={`${SIZE_MAP[size]} ${className}`} aria-hidden="true" />
}

interface StatusIconProps {
  status: StatusType
  className?: string
  size?: "sm" | "md" | "lg"
}

export function StatusIcon({ status, className = "", size = "md" }: StatusIconProps) {
  const IconComponent = STATUS_ICONS[status] || Sparkles
  return <IconComponent className={`${SIZE_MAP[size]} ${className}`} aria-hidden="true" />
}
