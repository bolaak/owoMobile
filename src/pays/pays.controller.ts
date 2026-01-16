// src/pays/pays.controller.ts
import { Controller, Get, Post, Body, Put, Param, Delete, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { PaysService } from './pays.service';
import { CreatePaysDto } from './dto/create-pays.dto';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';


@Controller('pays')
export class PaysController {
  constructor(private readonly paysService: PaysService) {}

  // Récupérer tous les pays
  @Get()
  async getAllPays() {
    return this.paysService.getAllPays();
  }

  // Récupérer un pays par son ID
  @Get(':id')
  async getPaysById(@Param('id') id: string) {
    return this.paysService.getPaysById(id);
  }

  // Ajouter un nouveau pays
  /*@Post()
  async createPays(@Body() paysData: any) {
    return this.paysService.createPays(paysData);
  }
  */
  @Post()
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  async createPays(@Body() paysData: CreatePaysDto) {
    return this.paysService.createPays(paysData);
  }

  // Mettre à jour un pays existant
  @Put(':id')
  @UseGuards(AdminGuard)
  async updatePays(@Param('id') id: string, @Body() updatedData: any) {
    return this.paysService.updatePays(id, updatedData);
  }

  // Supprimer un pays existant
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deletePays(@Param('id') id: string) {
    return this.paysService.deletePays(id);
  }

  // Activer un pays (status = Activated)
  @Put(':id/activate')
  @UseGuards(AdminGuard)
  async activatePays(@Param('id') id: string) {
    return this.paysService.updatePaysStatus(id, 'Activated');
  }

  // Désactiver un pays (status = Deactivated)
  @Put(':id/deactivate')
  @UseGuards(AdminGuard)
  async deactivatePays(@Param('id') id: string) {
    return this.paysService.updatePaysStatus(id, 'Deactivated');
  }

  // Suspendre un pays (status = Suspended)
  @Put(':id/suspend')
  @UseGuards(AdminGuard)
  async suspendPays(@Param('id') id: string) {
    return this.paysService.updatePaysStatus(id, 'Suspended');
  }
}