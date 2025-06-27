// roles.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/decorator/role.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) return true;


        const { user } = context.switchToHttp().getRequest();
        console.log('>>> request.user:', user);
        console.log('user.role:', user?.role); // e.g., "user"
        console.log('requiredRoles:', requiredRoles); // e.g., ["USERS"]
        return requiredRoles.includes(user.role);
    }
}
