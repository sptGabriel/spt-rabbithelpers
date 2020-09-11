import { Channel, Connection, Options, Replies } from 'amqplib';
import { ConnectionMQ } from './broker';
import { logger } from './utils/logger';
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
export type IExchange = {
  exchange_name: string;
  type: string;
  options?: Options.AssertExchange;
};
export interface IExchanges {
  [name: string]: IExchange;
}
export type QueuesToBind = {
  name: string;
  queue: IQueue;
  exchange: IExchange;
  pattern: string;
  args?: any;
};
export interface IBinds {
  [name: string]: QueuesToBind;
}
export class BrokerChannel {
  private queues: IQueue = undefined;
  private exchanges: IExchanges = undefined;
  private binds: IBinds = undefined;
  private static channel: Channel = undefined;
  constructor(connection: Connection) {}
  public getChannel = () => {
    return new Promise<Channel>((resolve, reject) => {
      if (BrokerChannel.channel) reject();
      ConnectionMQ.createChannel().then((ch) => {
        BrokerChannel.channel = ch;
        resolve(BrokerChannel.channel);
      });
    });
  };
  public subscribeBinds = (data: QueuesToBind | QueuesToBind[]) => {
    if (Array.isArray(data)) return isArrayOfBinds(data);
    if (this.binds[data.name]) return;
    this.binds[data.name] = data;
    function isArrayOfBinds(data) {
      data.forEach((bind: QueuesToBind) => {
        if (this.binds[data.name]) return;
        const { queue_name } = this.queues[bind.queue.queue_name];
        const { exchange_name } = this.exchanges[bind.exchange.exchange_name];
        if (!queue_name || exchange_name) return;
        this.binds[data.name] = bind;
      });
    }
  };
  public subscribeExchange = (data: IExchange | IExchange[]) => {
    if (Array.isArray(data)) return isArrayOfExchange(data);
    if (this.exchanges[data.exchange_name]) return;
    this.exchanges[data.exchange_name] = data;
    function isArrayOfExchange(data) {
      data.forEach((exchange) => {
        if (this.exchanges[exchange.exchange_name]) return;
        this.exchanges[exchange.exchange] = exchange;
      });
    }
  };
  public subscribeQueue = (data: IQueue) => {
    if (Array.isArray(data)) return isArrayOfQueue(data);
    if (this.queues[data.queue_name]) return;
    this.queues[data.queue_name] = data;
    function isArrayOfQueue(data) {
      data.forEach((queue) => {
        if (this.queues[queue.queue_name]) return;
        this.queues[queue.queue_name] = queue;
      });
    }
  };
  public assertQueues = () => {
    return Promise.all(
      [].concat(
        Object.keys(this.queues).map((key) => {
          const { queue_name, options }: IQueue = this.queues[key];
          return BrokerChannel.channel.assertQueue(queue_name, options);
        })
      )
    );
  };
  public assertExchanges = () => {
    return Promise.all(
      [].concat(
        Object.keys(this.exchanges).map((key) => {
          const { exchange_name, options }: IExchange = BrokerChannel.channel[
            key
          ];
          return BrokerChannel.channel.assertQueue(exchange_name, options);
        })
      )
    );
  };
  public bindExchangesToQueues = (data: QueuesToBind[]) => {
    return Promise.all(
      [].concat(
        data.map((bind: QueuesToBind) => {
          const { queue_name } = this.queues[bind.queue.queue_name];
          const { exchange_name } = this.exchanges[bind.exchange.exchange_name];
          BrokerChannel.channel.bindQueue(
            queue_name,
            exchange_name,
            bind.pattern,
            bind.args
          );
        })
      )
    ).catch((err: Error) => {
      logger.error(err);
      throw err;
    });
  };
  public bindExchangeToQueue = (data: QueuesToBind) => {
    return new Promise<Replies.Empty>((resolve, reject) => {
      const { queue_name } = this.queues[data.queue.queue_name];
      const { exchange_name } = this.exchanges[data.exchange.exchange_name];
      if (!queue_name || !exchange_name) {
        const mesage = queue_name
          ? 'subscribe queue on this channel'
          : 'subscribe exchange on this channel';
        reject(mesage);
      }
      BrokerChannel.channel
        .bindQueue(queue_name, exchange_name, data.pattern, data.args)
        .then((reply) => {
          resolve(reply);
        });
    }).catch((err: Error) => {
      logger.error(err);
      throw err;
    });
  };
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
