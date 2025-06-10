import { ExceptionFilter, Catch, ArgumentsHost, UnauthorizedException, HttpStatus, HttpException } from "@nestjs/common";
import { Response } from "express";
import { ApiResponse } from "src/common/base/api.response";

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        let message: string = 'Network Error';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (exceptionResponse && typeof exceptionResponse === 'object') {
                const responseObj = exceptionResponse as { message?: string };
                message = responseObj.message || 'Network Error';
            }
            switch (status) {
                case HttpStatus.BAD_REQUEST: //400
                    message = message || 'Dữ liệu không hợp lệ';
                    break;
                case HttpStatus.UNAUTHORIZED: //401
                    message = message || 'Bạn cần đăng nhập để thực hiện hành động này';
                    break;
                case HttpStatus.INTERNAL_SERVER_ERROR: //500
                    message = message || 'Lỗi INTERNAL_SERVER_ERROR';
                    break;
                default:
                    break;
            }

        } else {
            message = 'Lỗi hệ thống';
        }

        const apiResponse = ApiResponse.message(message, status);
        response.status(status).json(apiResponse);
    }
}