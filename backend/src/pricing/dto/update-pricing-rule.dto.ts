import { PartialType } from '@nestjs/mapped-types';
import { CreatePricingRuleDto } from './create-pricing.dto';

export class UpdatePricingRuleDto extends PartialType(CreatePricingRuleDto) {
  costPerKg: number;
  costPerKm: number;
}
