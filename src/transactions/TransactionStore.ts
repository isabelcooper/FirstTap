import {Random} from "../../utils/Random";

export interface Transaction {
  amount: number;
  category: string;
  itemRef: string;
  kioskRef: string;
  transactionTime?: Date | undefined;
  employeeId?: string;
}

export function buildTransaction(partial?: Partial<Transaction>): Transaction {
  return {
    amount: Random.integer(1000)/10,
    employeeId: Random.string('employee', 16),
    category: Random.string('food'),
    itemRef: Random.string('0012345'),
    kioskRef: Random.string('00012'),
    transactionTime: undefined,
    ...partial
  };
}

export class InMemoryTransactionStore implements TransactionStore {
  public transactions: Transaction[] = [];

  public async store(transaction: Transaction): Promise<Transaction | undefined> {
    this.transactions.push(transaction);
    return transaction
  }

  public async findAllByEmployeeId(employeeId: string): Promise<Transaction[]> {
    return this.transactions.filter(transaction => transaction.employeeId === employeeId);
  }
}

export interface TransactionStore {
  store(transaction: Transaction): Promise<Transaction | undefined>;

  findAllByEmployeeId(employeeId: string): Promise<Transaction[]>;
}
