export interface UtilisateurRecord {
    id: string;
    fields: {
        status: string;
        nom: string;
        prenom: string;
        date_naissance: string;
        nationalite: string;
        email: string;
        telephone: string;
        adresse: string;
        type_utilisateur: string;
        numero_compte: string;
        PIN: string;
        mot_de_passe: string;
        solde: number;
        pays_id: string[];
        nom_pays: string[];
        tentatives_echec: number;
        pays_status: string[];
        devise_code: string[];
        master_id?: string;
        master_associated?: string;
        createdDate: string;
        LastModifiedDate: string;
    };
}
