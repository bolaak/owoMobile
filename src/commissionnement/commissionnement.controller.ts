// src/commissionnement/commissionnement.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CommissionnementService } from './commissionnement.service';
import { CreateCommissionnementDto } from './dto/create-commissionnement.dto';


@Controller('commissionnement')
export class CommissionnementController {
  constructor(private readonly commissionnementService: CommissionnementService) {}

  // Récupérer tous les taux de commissionnement
  @Get()
  @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
  async getAllCommissionnements() {
    return this.commissionnementService.getAllCommissionnements();
  }

  // Récupérer un taux de commissionnement par son ID
  @Get(':id')
  @UseGuards(AdminGuard)
  async getCommissionnementById(@Param('id') id: string) {
    return this.commissionnementService.getCommissionnementById(id);
  }

  // Créer un nouveau taux de commissionnement
  @Post()
  @UseGuards(AdminGuard)
  @UsePipes(new ValidationPipe())
  async createCommissionnement(@Body() commissionData: CreateCommissionnementDto) {
    return this.commissionnementService.createCommissionnement(commissionData);
  }
  // Mettre à jour un taux de commissionnement existant
  @Put(':id')
  @UseGuards(AdminGuard)
  async updateCommissionnement(@Param('id') id: string, @Body() updatedData: any) {
    return this.commissionnementService.updateCommissionnement(id, updatedData);
  }

  // Supprimer un taux de commissionnement
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteCommissionnement(@Param('id') id: string) {
    return this.commissionnementService.deleteCommissionnement(id);
  }
}