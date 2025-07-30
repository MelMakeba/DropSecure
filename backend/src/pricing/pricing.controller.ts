import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { CreatePricingRuleDto } from './dto/create-pricing.dto';
import { UpdatePricingRuleDto } from './dto/update-pricing-rule.dto';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('admin/pricing/rules')
  async getRules() {
    return this.pricingService.getPricingRules();
  }

  @Post('admin/pricing/rules')
  async createRule(@Body() body: CreatePricingRuleDto) {
    return this.pricingService.createPricingRule(body);
  }

  @Put('admin/pricing/rules/:id')
  async updateRule(
    @Param('id') id: string,
    @Body() body: UpdatePricingRuleDto,
  ) {
    return this.pricingService.updatePricingRule(id, body);
  }
}
