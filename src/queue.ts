import { Channel, Options } from 'amqplib';
import { Exchange } from './Exchange';
import {
  AbstractChannelOptions,
  ISubscribeReponse,
} from './ChannelOptionsAbstract';

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
  subscribeArray = (data: IQueue[]): Promise<ISubscribeReponse<IQueue>>[] => {
    return data.map((queue) => {
      return this.subscribe(queue).then((value) => {
        return {
          isSubscribe: value,
          item: queue,
        };
      });
    });
  };

  subscribe = (data: IQueue): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      if (this.queues[data.queue_name]) reject(false);
      this.queues[data.queue_name] = data;
      resolve(true);
    }).catch((error: Error) => {
      throw error;
    });
  };
  assert = (data: IQueue): Promise<boolean> => {
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
  };
}
