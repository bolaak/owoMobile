// src/codes-recharge/codes-recharge.controller.ts
import { Controller, Get, Post, Body, Put, Delete, Param, UseGuards, UsePipes, ValidationPipe,Request, UseInterceptors, UploadedFiles, UploadedFile } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { CodesRechargeService } from './codes-recharge.service';
import { CreateCodeRechargeDto } from './dto/create-code-recharge.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';



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
   @Post('add')
   @UseGuards(AdminGuard)
   @UsePipes(new ValidationPipe())
  @UseInterceptors(
    FilesInterceptor('attached', 5, {
      storage: diskStorage({
        destination: './uploads', // Stocker les fichiers temporairement
        filename: (req, file, callback) => {
          callback(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    })
  )
   async createCodeRecharge(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() codeData: CreateCodeRechargeDto) {
     try {
     return this.codesRechargeService.createCodeRecharge(codeData, files);
     } catch (error) {
      console.error('Erreur lors de la création du code :', error.message);
      throw error;
    }
   }

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

    @Get('getUserCodes/:userId')
   @UseGuards(AuthGuard)
  async getRechargeCodes(@Param('userId') userId: string) {
    try {
      console.log(`Demande de la liste des codes de recharge pour l'utilisateur ID : ${userId}`);

      // Récupérer les codes de recharge
      const rechargeCodes = await this.codesRechargeService.getRechargeCodesForUser(userId);

      return {data: rechargeCodes};
    } catch (error) {
      console.error(`Erreur lors de la récupération des codes de recharge : ${error.message}`);
      throw new Error(`Erreur lors de la récupération des codes de recharge : ${error.message}`);
    }
  }
}