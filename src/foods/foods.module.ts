import { Module } from '@nestjs/common';
import { FoodsController } from './foods.controller';
import { FoodsService } from './foods.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationModule } from '../location/location.module';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [
    PrismaModule,     // ✅ PrismaService comes from here
    LocationModule,   // ✅ LocationService
    UploadsModule,    // ✅ ObjectStorageService (THIS WAS MISSING)
  ],
  controllers: [FoodsController],
  providers: [FoodsService],
})
export class FoodsModule {}
