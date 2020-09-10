import { Channel, Options } from 'amqplib';
import { ConnectionMQ } from './broker';
import { logger } from './utils/logger';
export interface IMessage {
  publishedAt: Date;
}
export interface IHandler<T> {
  handle(message: T): any;
}
export type IQueue = {
  name: string;
  options?: Options.AssertQueue;
  handler?: IHandler<IMessage>[];
};

export class BrokerChannel {
  static queues: IQueue[] = undefined;
  static channel: Channel = undefined;
  public static getChannel = () => {
    return new Promise<Channel>((resolve, reject) => {
      if (BrokerChannel.channel) reject();
      ConnectionMQ.createChannel().then((ch) => {
        BrokerChannel.channel = ch;
        resolve(BrokerChannel.channel);
      });
    });
  };
  public subscribe = (data: IQueue) => {};
  public unsubscribe = (queueToRemove: IQueue, handler) => {};
}

// export type QueuesToAssert = { queue: string; options?: Options.AssertQueue };
// export type ExchangesToAssert = {
//   exchange: string;
//   type: string;
//   options?: Options.AssertExchange;
// };
// export type QueuesToBind = {
//   queue: string;
//   source: string;
//   pattern: string;
//   args?: any;
// };
// public assertExchanges = (exchanges: ExchangesToAssert[]) => {
//   return Promise.all(
//     [].concat([
//       exchanges.map((exchange) => {
//         return Broker.channel.assertExchange(
//           exchange.exchange,
//           exchange.type,
//           exchange.options
//         );
//       }),
//     ])
//   );
// };
// static assertQueues = (queues: QueuesToAssert[]) => {
//   return Promise.all(
//     [].concat([
//       queues.map((queue) => {
//         return Broker.channel.assertQueue(queue.queue, queue.options);
//       }),
//     ])
//   );
// };
// static bindExchangesToQueues = (queues: QueuesToBind[]) => {
//   return Promise.all(
//     [].concat([
//       queues.map((queue) => {
//         return Broker.channel.bindQueue(
//           queue.queue,
//           queue.source,
//           queue.pattern,
//           queue.args
//         );
//       }),
//     ])
//   );
// };
