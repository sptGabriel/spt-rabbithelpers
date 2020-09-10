import { Connection, Channel, connect, Options } from 'amqplib';
import { logger } from './utils/logger';
import { retry } from './utils/retry';
import { BrokerChannel } from './channel';

class Broker {
  static connection: Connection = undefined;
  static channel: BrokerChannel = undefined;
  static urli: string = process.env.RABBIT_URL || 'url';
  private static listenConnectionEvents = (): Promise<Connection> => {
    return new Promise((resolve, reject) => {
      if (!Broker.connection) {
        Broker.urli ? Broker.start() : reject();
        reject();
      }
      resolve(
        Broker.connection.on('error', (err: Error) => {
          logger.error(err.message);
          setTimeout(Broker.start, 10000);
        }) &&
          Broker.connection.on('close', (err: Error) => {
            if (err) {
              logger.error('connection closed because err!');
              setTimeout(Broker.start, 10000);
            }
            logger.info('connection to RabbitQM closed!');
          })
      );
    });
  };
  private static connectRabbitMQ = () => {
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
          resolve(Broker.listenConnectionEvents());
        })
        .catch((err) => reject(new Error(err)));
    });
  };
  static start = () => {
    Broker.connectRabbitMQ()
      .then((connection) => {
        Broker.connection = connection;
      })
      .catch((error: Error) => {
        throw error;
      });
  };
}
export let ConnectionMQ: Connection = Broker.connection;
export let ChannelMQ: Channel = Broker.channel;
export let StartMQ = () => {
  return Broker.start();
};
