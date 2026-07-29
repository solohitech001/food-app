import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    description: 'Title of the notification',
    example: 'Profile Update Required',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Body message content of the notification',
    example: 'Please update your business opening hours for upcoming holidays.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}

// =========================================================================
// RESPONSE DTOS
// =========================================================================

export class VendorNotificationResponseDto {
  @ApiProperty({ example: 'notif-uuid-123' })
  id: string;

  @ApiProperty({ example: 'New Order Received' })
  title: string;

  @ApiProperty({ example: 'You have received a new order #ORD-8821.' })
  message: string;

  @ApiProperty({ example: false, description: 'Read status flag' })
  isRead: boolean;

  @ApiPropertyOptional({
    example: 'ORDER_CREATED',
    description: 'Notification category or event type trigger',
  })
  type?: string;

  @ApiProperty({ example: 'v123-uuid-890' })
  vendorId: string;

  @ApiProperty({ example: '2026-07-29T12:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '2026-07-29T12:05:00.000Z' })
  updatedAt?: Date;
}

export class UnreadNotificationCountResponseDto {
  @ApiProperty({
    description: 'Total count of unread notifications for the vendor',
    example: 5,
  })
  unreadCount: number;
}

export class NotificationActionSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notification processed successfully.' })
  message: string;
}