import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(credentials: {
        numero_compte: string;
        mot_de_passe: string;
    }): Promise<{
        message: string;
        token: any;
    }>;
}
