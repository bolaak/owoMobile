import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getAllUsers(): Promise<any>;
    createUser(userData: CreateUserDto): Promise<{
        numero_compte: string;
    }>;
    getUserById(id: string): Promise<any>;
    getUserByNumeroCompte(numero_compte: string): Promise<any>;
    updateUser(id: string, updatedData: any): Promise<{
        message: string;
    }>;
    deleteUser(id: string): Promise<{
        message: string;
    }>;
    recoverPIN(body: {
        numero_compte: string;
    }): Promise<{
        message: string;
    }>;
    unlockUser(body: {
        numero_compte: string;
    }): Promise<{
        message: string;
    }>;
    blockUser(body: {
        numero_compte: string;
    }): Promise<{
        message: string;
    }>;
    recoverPassword(body: RecoverPasswordDto): Promise<{
        message: string;
    }>;
    changePassword(user: any, body: ChangePasswordDto): Promise<{
        message: string;
    }>;
    getMarchandsByMasterId(masterId: string): Promise<any[]>;
    getMasterByMarchand(marchandId: string): Promise<any>;
    getAllMasters(): Promise<any>;
    consulterSolde(soldeData: {
        numero_compte: string;
        pin: string;
    }): Promise<{
        message: string;
        solde: any;
        deviseCode: any;
    }>;
}
