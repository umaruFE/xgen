import { ExpiresType } from '@/shared';
export declare function setExpires(target: object, property: string, value: ExpiresType, receiver: any): Date | undefined;
export declare function getExpires(target: object, property: string): Date | undefined;
export declare function removeExpires(target: object, property: string, receiver: any): undefined;
