import { ApiResponseKey } from 'src/enums/api-response-key.enum';
import { HttpStatus } from '@nestjs/common';

interface ApiResponseData<T, E = unknown> {
  [ApiResponseKey.STATUS]: boolean;
  [ApiResponseKey.CODE]: HttpStatus;
  [ApiResponseKey.DATA]?: T;
  [ApiResponseKey.ERRORS]?: E;
  [ApiResponseKey.MESSAGE]: string;
  [ApiResponseKey.TIMESTAMP]: string;
}

export type TApiResponse<T, E = unknown> = ApiResponseData<T, E>;

export class ApiResponse {
  private static getTimestamp(): string {
    return new Date().toISOString();
  }
  static ok<T>(
    data: T,
    message: string = '',
    httpStatus: HttpStatus = HttpStatus.OK
  ): ApiResponseData<T> {
    return {
      [ApiResponseKey.STATUS]: true,
      [ApiResponseKey.CODE]: httpStatus,
      [ApiResponseKey.DATA]: data,
      [ApiResponseKey.MESSAGE]: message,
      [ApiResponseKey.TIMESTAMP]: this.getTimestamp()
    };
  }

  static error<E>(
    errors: E,
    message: string,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST
  ): ApiResponseData<E> {
    return {
      [ApiResponseKey.STATUS]: false,
      [ApiResponseKey.CODE]: httpStatus,
      [ApiResponseKey.ERRORS]: errors,
      [ApiResponseKey.MESSAGE]: message,
      [ApiResponseKey.TIMESTAMP]: this.getTimestamp()
    };
  }

  static message(
    message: string,
    httpStatus: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR
  ): Record<string, unknown> {
    return {
      [ApiResponseKey.STATUS]:
        httpStatus === HttpStatus.OK || httpStatus === HttpStatus.CREATED,
      [ApiResponseKey.MESSAGE]: message,
      [ApiResponseKey.TIMESTAMP]: this.getTimestamp(),
      [ApiResponseKey.CODE]: httpStatus
    };
  }
}

// 1. Thành công:
//     - Chỉ có thông báo thành công (kh có data trả về)
//     - Thông báo thành công --> data trả về
// 2. Không thành công:
//     - Chỉ có thông báo lỗi (kh có data trả về)
//     - Thông báo lỗi (có errors trả về --> validate dữ liệu)
