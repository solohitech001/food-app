import { Module } from '@nestjs/common';
import { AfricasTalkingService } from './africastalking.service';

@Module({
  providers: [AfricasTalkingService],
  exports: [AfricasTalkingService], // 👈 VERY IMPORTANT
})
export class AfricasTalkingModule {}
