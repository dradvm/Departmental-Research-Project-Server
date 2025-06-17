// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, DeleteApiResponse } from 'cloudinary';

import * as streamifier from 'streamifier';
import { CloudinaryResponse } from './types/cloudinary-response';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  uploadImage(
    file: Express.Multer.File,
    folder: string = ''
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: folder
        },
        (error, result) => {
          if (error) return reject(new Error(JSON.stringify(error)));
          resolve(result!);
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const stream: Readable = streamifier.createReadStream(file.buffer);
      stream.pipe(uploadStream);
    });
  }
  uploadVideo(
    file: Express.Multer.File,
    folder: string = ''
  ): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'video',
          folder: folder
        },
        (error, result) => {
          if (error) return reject(new Error(JSON.stringify(error)));
          resolve(result!);
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const stream: Readable = streamifier.createReadStream(file.buffer);
      stream.pipe(uploadStream);
    });
  }
  async deleteImage(publicId: string): Promise<DeleteApiResponse> {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'image'
    }) as Promise<DeleteApiResponse>;
  }

  async deleteVideo(publicId: string): Promise<DeleteApiResponse> {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    }) as Promise<DeleteApiResponse>;
  }
}
