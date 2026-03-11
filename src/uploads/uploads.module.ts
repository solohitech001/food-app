import { Module } from '@nestjs/common';
import { ObjectStorageService } from './object-storage';

@Module({
  providers: [ObjectStorageService],
  exports: [ObjectStorageService],
})
export class UploadsModule {}
