// src/auth/auth.service.ts
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../users/users.service';
import { Config } from '../config';


@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

async login(numero_compte: string, mot_de_passe: string) {
  const user = await this.usersService.getUserByNumeroCompte(numero_compte);

  // Vérifier le statut du pays associé à l'utilisateur
  await this.usersService.checkCountryStatusForUser(user.id);

  // Vérifier le statut du compte
  await this.usersService.checkUserStatus(numero_compte);

  const isPasswordValid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);

  if (!isPasswordValid) {
    // Incrémenter les tentatives infructueuses
    await this.usersService.incrementFailedAttempts(numero_compte);
    throw new Error('Mot de passe incorrect.');
  }

  // Réinitialiser les tentatives infructueuses en cas de succès
  await this.usersService.resetFailedAttempts(numero_compte);

  const token = jwt.sign({ id: user.id, email: user.email, type_utilisateur: user.type_utilisateur, pass:user.mot_de_passe }, Config.JWT_SECRET, { expiresIn: '1h' });

    // Enregistrer un log
    /*await this.auditLogService.createLog(
      userId,
      'CREATE',
      'Utilisateur',
      createdUser[0].id,
      {numero_compte}
    );*/
  return { token };
 }

}