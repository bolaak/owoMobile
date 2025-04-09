// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
    async login(@Body() credentials: { numero_compte: string; mot_de_passe: string }) {
      try {
        const result = await this.authService.login(credentials.numero_compte, credentials.mot_de_passe);
        return { message: 'Connexion réussie', token: result.token };
      } catch (error) {
        //throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
        throw new Error(`Erreur lors de la connexion : ${error.message}`);

      }
  }

}

