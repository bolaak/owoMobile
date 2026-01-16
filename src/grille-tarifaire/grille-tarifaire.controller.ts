// src/grille-tarifaire/grille-tarifaire.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Param, ValidationPipe, UseGuards, UsePipes } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { GrilleTarifaireService } from './grille-tarifaire.service';
import { CreateGrilleTarifaireDto } from './dto/create-grille-tarifaire.dto';


@Controller('grille-tarifaire')
export class GrilleTarifaireController {
  constructor(private readonly grilleTarifaireService: GrilleTarifaireService) {}

  // Récupérer toutes les grilles tarifaires
  @Get()
  @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
  async getAllGrilleTarifaire() {
    return this.grilleTarifaireService.getAllGrilleTarifaire();
  }

  // Récupérer une grille tarifaire par son ID
  @Get(':id')
  @UseGuards(AdminGuard)
  async getGrilleTarifaireById(@Param('id') id: string) {
    return this.grilleTarifaireService.getGrilleTarifaireById(id);
  }

  // Créer une nouvelle grille tarifaire
  @Post()
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  async createGrilleTarifaire(@Body() grilleData: CreateGrilleTarifaireDto) {
    return this.grilleTarifaireService.createGrilleTarifaire(grilleData);
  }

  // Mettre à jour une grille tarifaire existante
  @Put(':id')
  @UseGuards(AdminGuard)
  async updateGrilleTarifaire(@Param('id') id: string, @Body() updatedData: any) {
    return this.grilleTarifaireService.updateGrilleTarifaire(id, updatedData);
  }

  // Supprimer une grille tarifaire
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteGrilleTarifaire(@Param('id') id: string) {
    return this.grilleTarifaireService.deleteGrilleTarifaire(id);
  }

  // Endpoint pour récupérer les plages tarifaires par pays
  @Get('pays/:paysId')
  @UseGuards(AdminGuard) // Seul un ADMIN peut accéder à cette route
  async getGrilleTarifaireByCountryId(@Param('paysId') paysId: string) {
    return this.grilleTarifaireService.getGrilleTarifaireByCountryId(paysId);
  }
}