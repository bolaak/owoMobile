// src/auth/auth.guard.ts
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { Config } from '../config';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>{
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    console.log('Token reçu :', token); // Log pour vérifier le token reçu

    if (!token) {
      throw new Error('Token manquant.');
    }

    try {
      const decoded = jwt.verify(token, Config.JWT_SECRET);
      console.log('Utilisateur décodé :', decoded); // Log pour vérifier les informations décodées

      request.user = decoded;

      if (decoded.type_utilisateur !== 'ADMIN') {
        console.log('Rôle de l\'utilisateur :', decoded.type_utilisateur); // Log pour vérifier le rôle
        throw new Error('Accès non autorisé.');
      }

      return true;
    } catch (error) {
      console.error('Erreur lors de la vérification du token :', error); // Log pour capturer les erreurs
      throw new Error('Token invalide.');
    }
  }
}