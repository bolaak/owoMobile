// src/users/users.controller.ts
import { Controller, Post, Body,Put, Get, Delete, Param, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { User } from '../decorators/user.decorator';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /*@Post('register')
  async registerUser(@Body() userData: any) {
    return this.usersService.createUser(userData);
  }*/
    @Get()
    @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
    async getAllUsers() {
      return this.usersService.getAllUsers();
    }
    
    @Post('register')
    @UsePipes(new ValidationPipe())
    async createUser(@Body() userData: CreateUserDto) {
      return this.usersService.createUser(userData);
    }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Get('numero/:numero_compte')
  async getUserByNumeroCompte(@Param('numero_compte') numero_compte: string) {
    return this.usersService.getUserByNumeroCompte(numero_compte);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateUser(@Param('id') id: string, @Body() updatedData: any) {
    return this.usersService.updateUser(id, updatedData);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }

  @Post('recover-pin')
  @UseGuards(AdminGuard) // Assurez-vous que seul un administrateur peut accéder à cette route
  async recoverPIN(@Body() body: { numero_compte: string }) {
    const { numero_compte } = body;

    if (!numero_compte) {
      throw new Error('Le numéro de compte est requis.');
    }

    return this.usersService.sendPINToUser(numero_compte);
  }

  @Post('unlock')
  @UseGuards(AdminGuard) // Assurez-vous que seul un administrateur peut accéder à cette route
  async unlockUser(@Body() body: { numero_compte: string }) {
    const { numero_compte } = body;

    if (!numero_compte) {
      throw new Error('Le numéro de compte est requis.');
    }

    return this.usersService.unlockUser(numero_compte);
  }

  @Post('block')
  @UseGuards(AuthGuard) // Assurez-vous que seul un administrateur peut accéder à cette route
  async blockUser(@Body() body: { numero_compte: string }) {
    const { numero_compte } = body;

    if (!numero_compte) {
      throw new Error('Le numéro de compte est requis.');
    }

    await this.usersService.blockUser(numero_compte);
    return { message: 'Le compte a été bloqué avec succès.' };
  }

@Post('recover-password')
@UsePipes(new ValidationPipe())
async recoverPassword(@Body() body: RecoverPasswordDto) {
  const { numero_compte } = body;

  return this.usersService.sendPasswordToUser(numero_compte);
}

@Post('change-password')
@UseGuards(AuthGuard)
@UsePipes(new ValidationPipe())
async changePassword( @User() user: any, @Body() body: ChangePasswordDto) {
  console.log('Utilisateur récupéré dans le contrôleur :', user); // Log pour vérifier l'utilisateur
  const { oldPassword, newPassword } = body;

  await this.usersService.changePassword(user.id, oldPassword, newPassword);
  return { message: 'Le mot de passe a été changé avec succès.' };
}

  // Endpoint pour récupérer les MARCHANDS associés à un MASTER
  @Get('masters/:masterId')
  @UseGuards(AdminGuard) // Seul un ADMIN peut accéder à cette route
  async getMarchandsByMasterId(@Param('masterId') masterId: string) {
    return this.usersService.getMarchandsByMasterId(masterId);
  }

  // Endpoint pour retrouver le MASTER associé à un MARCHAND
  @Get('marchand/:marchandId')
  //@UseGuards(AdminGuard) // Seul un ADMIN peut accéder à cette route
  async getMasterByMarchand(@Param('marchandId') marchandId: string) {
    return this.usersService.getMasterByMarchand(marchandId);
  }


  @Get('list-masters')
  @UseGuards(AdminGuard) // Seul un administrateur peut accéder à cette route
  async getAllMasters() {
    return this.usersService.getAllMasters();
  }

// endpoint pour consulter le solde d'un utilisateur.
@Post('consulter-solde')
@UseGuards(AuthGuard)
async consulterSolde(@Body() soldeData: { numero_compte: string; pin: string }) {
  const { numero_compte, pin } = soldeData;

  try {
    console.log('Données reçues pour la consultation du solde :', soldeData);

    // Récupérer l'utilisateur par son numéro de compte
    console.log('Récupération des données de l\'utilisateur...');
    const userRecord = await this.usersService.getUserByNumeroCompte(numero_compte);
    console.log('Utilisateur trouvé :', userRecord);

        // Vérifier que le pays de l'utilsateur est "Activated"
        console.log('Vérification du statut de l\'utilsateur...');
        await this.usersService.checkCountryStatusForUser(userRecord.id);
  
        // Vérifier que le statut du Master est "Activated"
        console.log('Vérification du statut de l\'utilsateur...');
        await this.usersService.checkUserStatus(numero_compte);

    // Vérifier le code PIN
    console.log('Validation du code PIN...');
    await this.usersService.validatePIN(numero_compte, pin);

    // Retourner le solde de l'utilisateur
    const deviseCode = userRecord.devise_code || 'X0F'; // Récupérer la devise du pays
    const solde = userRecord.solde || 0;
    console.log(`Solde consulté pour le numéro de compte : ${numero_compte}, Solde : ${solde} ${deviseCode}`);

    return { message: 'Consultation du solde réussie.', solde, deviseCode};
  } catch (error) {
    console.error('Erreur lors de la consultation du solde :', error.message);
    throw new Error(`Erreur lors de la consultation du solde : ${error.message}`);
  }
}
}