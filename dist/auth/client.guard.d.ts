import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class ClientGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
