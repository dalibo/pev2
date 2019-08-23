import {WorkerProp} from '@/enums';
// Class to create workers when parsing text
export default class Worker {
  [k: string]: any;
  constructor(workerNumber: number) {
    this[WorkerProp.WORKER_NUMBER] = workerNumber;
  }
}
