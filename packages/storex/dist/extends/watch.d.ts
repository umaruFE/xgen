import { EffectFn } from '@/shared';
export declare function on(this: any, target: object, key: string, fn: EffectFn): void;
export declare function once(this: any, target: object, key: string, fn: EffectFn): void;
export declare function off(target: object, key?: string, fn?: EffectFn): void;
export declare function emit(target: object, key: string, ...args: any[]): void;
