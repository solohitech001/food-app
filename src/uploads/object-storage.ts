import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import { extname } from 'path';

@Injectable()
export class ObjectStorageService {
  private s3Client: S3Client;
  private readonly bucketName = 'magikworldgifts';
  private readonly region = 'eu-central-1';


  constructor() {
    this.s3Client = new S3Client({
      region: this.region,
      endpoint: `https://${this.region}.linodeobjects.com`,
      credentials: {
        accessKeyId: 'BO2MFYSYNZCFUV9U8LTN',
        secretAccessKey: "jaYJNU1qJIV1mIHnjHqmYOY5BfiECurRAiJo0nwV",
      },
      forcePathStyle: true,
    });
  }

  async uploadFile(file: Express.Multer.File, folder = 'foods/'): Promise<string> {
    const fileName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1e9) +
      extname(file.originalname);

    const key = folder + fileName;

    try {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: ObjectCannedACL.public_read,
        }),
      );

      return `https://${this.bucketName}.${this.region}.linodeobjects.com/${key}`;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Upload failed');
    }
  }
}
