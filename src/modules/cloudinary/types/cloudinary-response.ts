// cloudinary-response.ts
import { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

export type CloudinaryResponse = UploadApiResponse | UploadApiErrorResponse;

export type ImageCloudinary = {
  public_id: string;
  secure_url: string;
};
