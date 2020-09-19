import { getRepository, getCustomRepository } from 'typeorm';

import AppError from '../errors/AppError';
import TransactionsRepository from '../repositories/TransactionsRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const categoriesRespository = getRepository(Category);
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    if (!type || !title || !value || !category) {
      throw new AppError('All informations are essentials');
    }

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError('Type must be outcome or income');
    }

    if (type === 'outcome') {
      let { total } = await transactionsRepository.getBalance();

      total -= value;

      if (total < 0) {
        throw new AppError('You do not have enough money');
      }
    }

    const existedCategory = await categoriesRespository.findOne({
      where: {
        title: category,
      },
    });

    let categoryObject;

    if (!existedCategory) {
      const newCategory = categoriesRespository.create({
        title: category,
      });

      categoryObject = newCategory;

      await categoriesRespository.save(newCategory);
    } else {
      categoryObject = existedCategory;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category: categoryObject,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
