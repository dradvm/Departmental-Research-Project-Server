import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    attemp(): string {
        return 'Attempt from auth service';
    }
}
