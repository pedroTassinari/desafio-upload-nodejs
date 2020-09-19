import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const transactions = await this.find({
      select: ['value', 'type'],
    });

    let income = 0;
    let outcome = 0;
    let total = 0;

    transactions.forEach(({ type, value }) => {
      if (type === 'income') {
        income += value;
        total += value;
      } else {
        outcome += value;
        total -= value;
      }
    });

    const Balance = {
      income,
      outcome,
      total,
    };

    return Balance;
  }
}

export default TransactionsRepository;
