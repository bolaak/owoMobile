import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export declare class AllExceptionsFilter<T> implements ExceptionFilter {
    catch(exception: T, host: ArgumentsHost): void;
}
