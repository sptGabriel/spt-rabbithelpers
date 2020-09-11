import { Channel, Options } from 'amqplib';
export interface ISubscribeReponse<T> {
  isSubscribe: boolean;
  item: T;
}
export abstract class AbstractChannelOptions<T> {
  channel: Channel;
  constructor(channel: Channel) {
    this.channel = channel;
  }
  subscribeArray = (data: T[]): Promise<ISubscribeReponse<T>>[] => {
    throw new Error('Method not implemented.');
  };
  subscribe = (data: T): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };
  assert = (data: T): Promise<boolean> => {
    throw new Error('Method not implemented.');
  };
}
