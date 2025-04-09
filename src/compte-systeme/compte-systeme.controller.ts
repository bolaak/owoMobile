// src/compte-systeme/compte-systeme.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { CompteSystemeService } from './compte-systeme.service';
import { CreateCompteSystemeDto } from './dto/create-compte-systeme.dto';

@Controller('compte-systeme')
export class CompteSystemeController {
  constructor(private readonly compteSystemeService: CompteSystemeService) {}

  // Récupérer tous les comptes système
  @Get()
  @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
  async getAllComptesSysteme() {
    return this.compteSystemeService.getAllComptesSysteme();
  }

  // Récupérer un compte système par son ID
  @Get(':id')
  @UseGuards(AdminGuard)
  async getCompteSystemeById(@Param('id') id: string) {
    return this.compteSystemeService.getCompteSystemeById(id);
  }

  // Créer un nouveau compte système
  /*@Post()
  @UseGuards(AdminGuard)
  async createCompteSysteme(@Body() compteData: any) {
    return this.compteSystemeService.createCompteSysteme(compteData);
  }*/
    @Post()
    @UseGuards(AdminGuard)
    @UsePipes(new ValidationPipe())
    async createCompteSysteme(@Body() compteData: CreateCompteSystemeDto) {
      return this.compteSystemeService.createCompteSysteme(compteData);
    }

  // Mettre à jour un compte système existant
  @Put(':id')
  @UseGuards(AdminGuard)
  async updateCompteSysteme(@Param('id') id: string, @Body() updatedData: any) {
    return this.compteSystemeService.updateCompteSysteme(id, updatedData);
  }

  // Supprimer un compte système
  @Delete(':id')
  @UseGuards(AdminGuard)
  async deleteCompteSysteme(@Param('id') id: string) {
    return this.compteSystemeService.deleteCompteSysteme(id);
  }
}