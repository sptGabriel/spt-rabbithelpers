import { Channel, Options } from 'amqplib';
import { Exchange } from './exchange';
import { AbstractChannelOptions } from './QueueAbstract';

export interface IMessage {
  publishedAt: Date;
}
export interface IHandler {
  handle(message: IMessage): any;
}
export type IQueue = {
  queue_name: string;
  options?: Options.AssertQueue;
  handlers?: IHandler[];
};
export interface IQueues {
  [name: string]: IQueue;
}
export class Queue extends AbstractChannelOptions<IQueue> {
  queues: IQueues = undefined;
  exchange: Exchange;
  constructor(channel: Channel, exchange: Exchange) {
    super(channel);
    this.exchange = exchange;
  }
  subscribe(data: IQueue): boolean {
    if (Array.isArray(data)) return isArrayOfQueue(data);
    if (this.queues[data.queue_name]) return false;
    this.queues[data.queue_name] = data;
    function isArrayOfQueue(data) {
      return data.forEach((queue) => {
        if (this.queues[queue.queue_name]) return;
        this.queues[queue.queue_name] = queue;
        return true;
      });
    }
  }
  assert(data: IQueue) {
    return Promise.all(
      [].concat(
        Object.keys(this.queues).map((key) => {
          const { queue_name, options }: IQueue = this.queues[key];
          return this.channel.assertQueue(queue_name, options);
        })
      )
    )
      .then((sucess) => {
        return true;
      })
      .catch((error: Error) => {
        throw error;
      });
  }
}
