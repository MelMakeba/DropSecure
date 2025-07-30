import { IsString, IsBoolean, IsNumber, Min } from 'class-validator';

export class CreatePricingRuleDto {
  @IsString()
  name: string;

  @IsBoolean()
  isActive: boolean;

  @IsNumber()
  @Min(0)
  baseCost: number;

  @IsNumber()
  @Min(0)
  weightMultiplier: number;

  @IsNumber()
  @Min(0)
  distanceMultiplier: number;

  @IsNumber()
  @Min(0)
  maxWeight: number;

  @IsNumber()
  @Min(0)
  maxDistance: number;
  costPerKg: number;
  costPerKm: number;
}
