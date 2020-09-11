import { Channel, Options } from 'amqplib';
import {
  AbstractChannelOptions,
  ISubscribeReponse,
} from './ChannelOptionsAbstract';
export type IExchange = {
  exchange_name: string;
  type: string;
  options?: Options.AssertExchange;
};
export interface IExchanges {
  [name: string]: IExchange;
}
export class Exchange extends AbstractChannelOptions<IExchange> {
  channel: Channel;
  exchanges: IExchanges = undefined;
  constructor(channel: Channel) {
    super(channel);
    this.channel = channel;
  }
  subscribeArray = (
    data: IExchange[]
  ): Promise<ISubscribeReponse<IExchange>>[] => {
    return data.map((exchange) => {
      return this.subscribe(exchange).then((value) => {
        return {
          isSubscribe: value,
          item: exchange,
        };
      });
    });
  };

  subscribe = (data: IExchange): Promise<boolean> => {
    return new Promise<boolean>((resolve, reject) => {
      if (this.exchanges[data.exchange_name]) reject(false);
      this.exchanges[data.exchange_name] = data;
      resolve(true);
    }).catch((error: Error) => {
      throw error;
    });
  };
  assert = (data: IExchange): Promise<boolean> => {
    return Promise.all(
      [].concat(
        Object.keys(this.exchanges).map((key) => {
          const { exchange_name, options }: IExchange = this.channel[key];
          return this.channel.assertQueue(exchange_name, options);
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
