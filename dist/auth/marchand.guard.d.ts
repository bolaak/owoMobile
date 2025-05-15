import { CanActivate, ExecutionContext } from '@nestjs/common';
export declare class MarchandGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean | Promise<boolean>;
}
