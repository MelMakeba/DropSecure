export interface PricingRule {
  id: string;
  name: string;
  description?: string | null;
  minWeight: number;
  maxWeight: number;
  minDistance: number;
  maxDistance: number;
  baseCost: number;
  weightMultiplier: number;
  distanceMultiplier: number;
  costPerKg: number;
  costPerKm: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CostCalculationInput {
  weight: number;
  distance: number;
}

export interface CostCalculationResult {
  estimatedCost: number;
  appliedRule: PricingRule;
}

export interface EstimateDeliveryCostInput {
  weight: number;
  from: [number, number]; // [lat, lng]
  to: [number, number]; // [lat, lng]
}
