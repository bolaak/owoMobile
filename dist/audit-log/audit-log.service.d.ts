export declare class AuditLogService {
    private base;
    constructor();
    createLog(userId: string, operationType: string, resourceType: string, resourceId: string, details: any): Promise<void>;
    getAllLogs(): Promise<any>;
}
