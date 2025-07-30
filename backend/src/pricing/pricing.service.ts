/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  PricingRule,
  CostCalculationResult,
  CostCalculationInput,
} from './interfaces/pricing.interfaces';
import { CreatePricingRuleDto } from './dto/create-pricing.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  async calculatePackageCost(
    input: CostCalculationInput,
  ): Promise<CostCalculationResult> {
    const rules = await this.getPricingRules();
    const rule = rules.find(
      (r) => input.weight <= r.maxWeight && input.distance <= r.maxDistance,
    );
    if (!rule) throw new Error('No pricing rule found');
    const estimatedCost =
      rule.baseCost +
      input.weight * rule.weightMultiplier +
      input.distance * rule.distanceMultiplier;
    return { estimatedCost, appliedRule: rule };
  }

  async getPricingRules(): Promise<PricingRule[]> {
    const rules = await this.prisma.pricingRule.findMany({
      where: { isActive: true },
    });
    // Map nullable fields to non-nullable, or provide defaults
    return rules.map((rule) => ({
      ...rule,
      minWeight: rule.minWeight ?? 0,
      maxWeight: rule.maxWeight ?? 0,
      minDistance: rule.minDistance ?? 0,
      maxDistance: rule.maxDistance ?? 0,
      costPerKg: rule.costPerKg ?? 0,
      costPerKm: rule.costPerKm ?? 0,
    }));
  }

  async createPricingRule(data: CreatePricingRuleDto): Promise<PricingRule> {
    // Ensure all required fields are present
    const completeData = {
      ...data,
      maxWeight: data.maxWeight ?? 0,
      maxDistance: data.maxDistance ?? 0,
      costPerKg: data.costPerKg ?? 0,
      costPerKm: data.costPerKm ?? 0,
    };
    const rule = await this.prisma.pricingRule.create({ data: completeData });
    return {
      ...rule,
      minWeight: rule.minWeight ?? 0,
      maxWeight: rule.maxWeight ?? 0,
      minDistance: rule.minDistance ?? 0,
      maxDistance: rule.maxDistance ?? 0,
      costPerKg: rule.costPerKg ?? 0,
      costPerKm: rule.costPerKm ?? 0,
    };
  }

  async updatePricingRule(
    id: string,
    data: UpdatePricingRuleDto,
  ): Promise<PricingRule> {
    const completeData = {
      ...data,
      maxWeight: data.maxWeight ?? 0,
      maxDistance: data.maxDistance ?? 0,
      costPerKg: data.costPerKg ?? 0,
      costPerKm: data.costPerKm ?? 0,
    };
    const rule = await this.prisma.pricingRule.update({
      where: { id },
      data: completeData,
    });
    return {
      ...rule,
      minWeight: rule.minWeight ?? 0,
      maxWeight: rule.maxWeight ?? 0,
      minDistance: rule.minDistance ?? 0,
      maxDistance: rule.maxDistance ?? 0,
      costPerKg: rule.costPerKg ?? 0,
      costPerKm: rule.costPerKm ?? 0,
    };
  }

  //   async estimateDeliveryCost(
  //     input: EstimateDeliveryCostInput,
  //   ): Promise<CostCalculationResult> {
  //     const distance = await this.calculateDistance(input.from, input.to);
  //     return this.calculatePackageCost({ weight: input.weight, distance });
  //   }

  //   async calculateDistance(
  //     from: [number, number],
  //     to: [number, number],
  //   ): Promise<number> {
  //     // TODO: Integrate Google Maps API or use haversine formula
  //     // Placeholder implementation:
  //     return 10;
  //   }
}
