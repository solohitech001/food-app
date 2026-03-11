import { Test, TestingModule } from '@nestjs/testing';
import { AfricastalkingVoiceService } from './africastalking-voice.service';

describe('AfricastalkingVoiceService', () => {
  let service: AfricastalkingVoiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AfricastalkingVoiceService],
    }).compile();

    service = module.get<AfricastalkingVoiceService>(AfricastalkingVoiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
