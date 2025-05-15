import { UsersService } from '../users/users.service';
export declare class AuthService {
    private readonly usersService;
    constructor(usersService: UsersService);
    login(numero_compte: string, mot_de_passe: string): Promise<{
        token: any;
    }>;
}
