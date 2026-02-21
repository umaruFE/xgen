import type { Queue } from './types';
export default class Flow {
    namespace: string;
    private raw_queue;
    private run_queue;
    private run_index;
    private results;
    __ORDER_LOGS__: string[];
    init(namespace: string, queue: Queue): void;
    private pushRunQueue;
    private run;
    private handleTask;
    done(): void;
    private __PUSH_ORDER_LOGS__;
}
