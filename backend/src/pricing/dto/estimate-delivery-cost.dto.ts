import { IsNumber, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class EstimateDeliveryCostDto {
  @IsNumber()
  weight: number;

  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  from: [number, number];

  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  to: [number, number];
}
