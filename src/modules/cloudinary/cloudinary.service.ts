// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, DeleteApiResponse } from 'cloudinary';

import * as streamifier from 'streamifier';
import {
  CloudinaryResponse,
  ImageCloudinary
} from './types/cloudinary-response';
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
  async uploadImages(
    files: Express.Multer.File[] | undefined,
    folder: string = ''
  ) {
    if (!files) {
      return [];
    }
    const uploadResults: PromiseSettledResult<CloudinaryResponse>[] =
      await Promise.allSettled(
        files.map((file: Express.Multer.File) => this.uploadImage(file, folder))
      );
    const successUploads: ImageCloudinary[] = uploadResults
      .filter(
        (res: PromiseSettledResult<CloudinaryResponse>) =>
          res.status === 'fulfilled'
      )
      .map((res) => res.value as ImageCloudinary);
    const failedUploads = uploadResults
      .filter(
        (res: PromiseSettledResult<CloudinaryResponse>) =>
          res.status === 'rejected'
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map((res) => res.reason);
    if (failedUploads.length > 0) {
      await this.deleteImages(successUploads.map((img) => img.public_id));
      throw new Error(
        `Upload ảnh thất bại. Đã xóa ${successUploads.length} ảnh đã upload.`
      );
    }
    return successUploads;
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
  async deleteImages(publicIds: string[]) {
    await Promise.all(publicIds.map((publicId) => this.deleteImage(publicId)));
  }

  async deleteVideo(publicId: string): Promise<DeleteApiResponse> {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: 'video'
    }) as Promise<DeleteApiResponse>;
  }
}
