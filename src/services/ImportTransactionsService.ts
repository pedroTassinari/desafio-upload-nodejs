import csvParse from 'csv-parse';
import fs from 'fs';

import { getCustomRepository, getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionRespository from '../repositories/TransactionsRepository';

interface TransactionType {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category_id: string;
}

interface DTO {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filepath: string): Promise<Transaction[]> {
    const transactionRespository = getCustomRepository(TransactionRespository);
    const categoryRepository = getRepository(Category);

    const readCSVStream = fs.createReadStream(filepath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const transactions: DTO[] = [];
    const categories: string[] = [];

    parseCSV.on('data', line => {
      const [title, type, value, category] = line;
      transactions.push({
        title,
        type,
        value,
        category,
      });

      categories.push(category);
    });

    await new Promise(resolve => {
      parseCSV.on('end', resolve);
    });

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const existentCategoriesTittles = existentCategories.map(
      category => category.title,
    );

    const addCategoriesTittles = categories
      .filter(category => !existentCategoriesTittles.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const addCategories = addCategoriesTittles.map(title => ({
      title,
    }));

    const newCategories = categoryRepository.create(addCategories);
    await categoryRepository.save(newCategories);

    const allCategories = [...existentCategories, ...newCategories];

    const addTransactions = transactions.map(
      ({ title, type, category, value }) => ({
        title,
        type,
        value,
        category: allCategories.find(
          ({ title: categoryTittle }) => categoryTittle === category,
        ),
      }),
    );

    const newTransactions = transactionRespository.create(addTransactions);

    await transactionRespository.save(newTransactions);

    return newTransactions;
  }
}

export default ImportTransactionsService;
