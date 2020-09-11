import { Channel, Options } from 'amqplib';
import { AbstractChannelOptions } from './QueueAbstract';

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
  subscribe(data: IExchange): boolean {
    if (Array.isArray(data)) return isArrayOfExchange(data);
    if (this.exchanges[data.exchange_name]) return false;
    this.exchanges[data.exchange_name] = data;
    return true;
    function isArrayOfExchange(data) {
      const exchangesAdded = data.map((exchange) => {
        if (this.exchanges[exchange.exchange_name]) return;
        this.exchanges[exchange.exchange] = exchange;
        return exchange;
      });
      if (!exchangesAdded) return false;
      return true;
    }
  }
  assert(data: IExchange): boolean {
    throw new Error('Method not implemented.');
  }
}
