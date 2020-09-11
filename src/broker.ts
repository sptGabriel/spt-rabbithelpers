import { Connection, Channel, connect, Options } from 'amqplib';
import { logger } from './utils/logger';
import { retry } from './utils/retry';
import { BrokerChannel } from './Channel';

class Broker {
  static connection: Connection = undefined;
  private channel: BrokerChannel = undefined;
  static urli: string = process.env.RABBIT_URL || 'url';
  constructor(channel: BrokerChannel) {
    this.channel = channel;
  }
  private listenConnectionEvents = (): Promise<Connection> => {
    return new Promise((resolve, reject) => {
      if (!Broker.connection) {
        Broker.urli ? this.start() : reject();
        reject();
      }
      resolve(
        Broker.connection.on('error', (err: Error) => {
          logger.error(err.message);
          setTimeout(() => this.start, 10000);
        }) &&
          Broker.connection.on('close', (err: Error) => {
            if (err) {
              logger.error('connection closed because err!');
              setTimeout(() => this.start, 10000);
            }
            logger.info('connection to RabbitQM closed!');
          })
      );
    });
  };
  private connectRabbitMQ = () => {
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
          resolve(this.listenConnectionEvents());
        })
        .catch((err) => reject(new Error(err)));
    });
  };
  public start = () => {
    this.connectRabbitMQ().catch((error: Error) => {
      throw error;
    });
  };
}
// const Queue = new Queue();
// const Exchange = new Exchange
// const Channel = new Channel();
// const Server = new Broker();
export let ConnectionMQ: Connection = Broker.connection;

// export let ChannelMQ: Channel = BrokerChannel.channel;
// export let subscribeQueue = BrokerChannel.subscribeQueue({ queue_name: 'A' });
