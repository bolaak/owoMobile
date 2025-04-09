// src/validators/is-master-exists.validator.ts
import { Injectable } from '@nestjs/common';
import { ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from 'class-validator';
import { CodesRechargeService } from '../codes-recharge/codes-recharge.service';

@ValidatorConstraint({ name: 'IsMasterExists', async: true })
@Injectable()
export class IsMasterExists implements ValidatorConstraintInterface {
  constructor(private readonly codesRechargeService: CodesRechargeService) {}

  async validate(masterId: string, args: ValidationArguments) {
    try {
      await this.codesRechargeService.validateMasterId(masterId);
      return true;
    } catch (error) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return `Le Master spécifié (ID: ${args.value}) est introuvable ou n'est pas de type MASTER.`;
  }
}