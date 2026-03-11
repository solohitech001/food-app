import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class TermiiService {
  private senderId = "N-Alert";
  private apiKey = "TLLtsOlsYSuvezfdSBgMbkjFCLJOmPRYpSMVCEqHyYYkyLulMuoMadMPjgeqOg";
  // private senderId = process.env.TERMII_SENDER_ID;

//   TERMII_API_KEY=TLLtsOlsYSuvezfdSBgMbkjFCLJOmPRYpSMVCEqHyYYkyLulMuoMadMPjgeqOg
// TERMII_SENDER_ID=N-Alert

  async sendOtp(phoneNumber: string, otp: string) {
    try {
      const response = await axios.post(
        'https://api.termii.com/api/sms/send',
        { 
          to: phoneNumber, 
          from: this.senderId,
          sms: `Your PLATTER verification code is ${otp}`,
          type: 'plain',
          channel: 'dnd',
          api_key: this.apiKey,
        },
      );

      return response.data;

    } catch (error: unknown) {

      if (axios.isAxiosError(error)) {
        console.error('Termii SMS Error:', error.response?.data);
      } else {
        console.error('Unknown Error:', error);
      }

      throw new Error('Failed to send OTP SMS');
    }
  }
}
