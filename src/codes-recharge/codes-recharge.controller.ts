// src/codes-recharge/codes-recharge.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CodesRechargeService } from './codes-recharge.service';
import { CreateCodeRechargeDto } from './dto/create-code-recharge.dto';

@Controller('codes-recharge')
export class CodesRechargeController {
  constructor(private readonly codesRechargeService: CodesRechargeService) {}

  // Récupérer tous les codes de recharge
  @Get()
  @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
  async getAllCodesRecharge() {
    return this.codesRechargeService.getAllCodesRecharge();
  }

  // Récupérer un code de recharge par son ID
  @Get(':id')
  @UseGuards(AdminGuard)
  async getCodeRechargeById(@Param('id') id: string) {
    return this.codesRechargeService.getCodeRechargeById(id);
  }

   // Créer un nouveau code de recharge
   @Post()
   @UseGuards(AdminGuard)
   @UsePipes(new ValidationPipe())
   async createCodeRecharge(@Body() codeData: CreateCodeRechargeDto) {
     return this.codesRechargeService.createCodeRecharge(codeData);
   }

  /*@Post()
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  async createCodeRecharge(@Body() codeData: CreateCodeRechargeDto) {
    return this.codesRechargeService.createCodeRecharge(codeData);
  }*/

  // Mettre à jour un code de recharge existant
  @Put(':id')
  @UseGuards(AdminGuard)
  async updateCodeRecharge(@Param('id') id: string, @Body() updatedData: any) {
    return this.codesRechargeService.updateCodeRecharge(id, updatedData);
  }

  // Supprimer un code de recharge
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteCodeRecharge(@Param('id') id: string) {
    return this.codesRechargeService.deleteCodeRecharge(id);
  }
}