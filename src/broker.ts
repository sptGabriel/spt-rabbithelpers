import { Connection, Channel, connect, Options } from 'amqplib';
import { logger } from './utils/logger';
import { retry } from './utils/retry';

export interface IMessage {
  publishedAt: Date;
}
export interface IHandler<T> {
  handle(message: T): any;
}
export interface Queue {
  (queues: string): {
    name: string;
    options?: Options.AssertQueue;
    handler?: IHandler<IMessage>;
  };
}
export type QueuesToAssert = { queue: string; options?: Options.AssertQueue };
export type ExchangesToAssert = {
  exchange: string;
  type: string;
  options?: Options.AssertExchange;
};
export type QueuesToBind = {
  queue: string;
  source: string;
  pattern: string;
  args?: any;
};
//static
class Broker {
  static connection: Connection = undefined;
  static channel: Channel = undefined;
  static urli: string = process.env.RABBIT_URL || 'url';

  public static getChannel = () => {
    return new Promise<Channel>((resolve, reject) => {
      if (Broker.channel) reject();
      Broker.connection.createChannel().then((ch) => {
        Broker.channel = ch;
        resolve(Broker.channel);
      });
    });
  };
  public static start = () => {
    return new Promise<Connection>((resolve, reject) => {
      if (Broker.connection || !Broker.urli) {
        const message = !Broker.urli
          ? 'The host of rabbitmq was not found in the environment variables'
          : 'Connection has already been established';
        logger.info(message);
        reject(new Error(message));
      }
      retry<Connection>(() => connect(Broker.urli), 10, 1000)
        .then((conn) => {
          Broker.connection = conn;
          resolve(Broker.connection);
        })
        .catch((err) => reject(new Error(err)));
    });
  };
  public assertExchanges = (exchanges: ExchangesToAssert[]) => {
    return Promise.all(
      [].concat([
        exchanges.map((exchange) => {
          return Broker.channel.assertExchange(
            exchange.exchange,
            exchange.type,
            exchange.options
          );
        }),
      ])
    );
  };
  static assertQueues = (queues: QueuesToAssert[]) => {
    return Promise.all(
      [].concat([
        queues.map((queue) => {
          return Broker.channel.assertQueue(queue.queue, queue.options);
        }),
      ])
    );
  };
  static bindExchangesToQueues = (queues: QueuesToBind[]) => {
    return Promise.all(
      [].concat([
        queues.map((queue) => {
          return Broker.channel.bindQueue(
            queue.queue,
            queue.source,
            queue.pattern,
            queue.args
          );
        }),
      ])
    );
  };
}
export let ConnectionMQ: Connection = Broker.connection;
export let ChannelMQ: Channel = Broker.channel;
export let StartMQ = () => {
  return Broker.start();
};
