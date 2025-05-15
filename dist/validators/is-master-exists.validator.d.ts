import { ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { CodesRechargeService } from '../codes-recharge/codes-recharge.service';
export declare class IsMasterExists implements ValidatorConstraintInterface {
    private readonly codesRechargeService;
    constructor(codesRechargeService: CodesRechargeService);
    validate(masterId: string, args: ValidationArguments): Promise<boolean>;
    defaultMessage(args: ValidationArguments): string;
}
