import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AfricasTalkingService {
  private readonly logger = new Logger(AfricasTalkingService.name);

  // ✅ CORRECT credentials
  private readonly username = 'SoloPlatter';
  private readonly apiKey = 'atsk_40852b520d14841a5d105c05cb3b237e88d6242cecb42b30223f04af15b474c21a4e0eae'

  // ✅ CORRECT endpoint
  private readonly apiUrl = 'https://api.africastalking.com/version1/messaging';

  async sendOtp(phoneNumber: string, otp: string) {
    const formattedPhone = phoneNumber.startsWith('+')
      ? phoneNumber
      : `+${phoneNumber}`;

    const data = new URLSearchParams({
      username: this.username,
      to: formattedPhone,
      message: `Your Platter verification code is ${otp}. Expires in 5 minutes.`,
    });

    try {
      const response = await axios.post(
        this.apiUrl,
        data.toString(),
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
            apiKey: this.apiKey,
          },
        },
      );

      this.logger.log(`SMS sent successfully to ${formattedPhone}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Africa’s Talking SMS Error:',
          error.response?.data || error.message,
        );
      }
      throw new Error('Failed to send OTP SMS');
    }
  }
}
