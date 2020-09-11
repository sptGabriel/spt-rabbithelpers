import { Channel, Options } from 'amqplib';

export abstract class AbstractChannelOptions<T> {
  channel: Channel;
  constructor(channel: Channel) {
    this.channel = channel;
  }
  subscribe(data: T): boolean {
    throw new Error('Method not implemented.');
  }
  assert(data: T): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
}
