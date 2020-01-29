import {Action, Employee, EmployeeStore, TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Transaction, TransactionStore} from "./TransactionStore";

export interface TransactionManagerClass {
  updateBalance(employeeId: string, amount: number, transactionType: TransactionType, transactionDetails: Transaction | undefined): Promise<Employee | undefined>;

  retrieveBalance(employeeId: string): Promise<number>;
}

export class InMemoryTransactionManager implements TransactionManagerClass {
  public employees: Employee[] = [];
  public transactions: Transaction[] = [];

  public async retrieveBalance(employeeId: string): Promise<number> {
    const matchedEmployee = this.findEmployee(employeeId);
    if(!matchedEmployee) throw new Error('User not found');
    return matchedEmployee.balance;
  }

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType, transactionDetails: Transaction | undefined): Promise<Employee | undefined> {
    const updateThisEmployee = this.findEmployee(employeeId);

    if (!updateThisEmployee) return;
    if (updateThisEmployee.balance === undefined) updateThisEmployee.balance = amount;
    else if (transactionType === TransactionType.TOPUP) updateThisEmployee.balance += amount;
    else if (transactionType === TransactionType.PURCHASE) {
      if (transactionDetails) await this.storeTransaction(transactionDetails);

      if (updateThisEmployee.balance >= amount) {
        updateThisEmployee.balance -= amount
      } else {
        throw new Error('Insufficient funds, please top up to continue')
      }
    }
    return updateThisEmployee
  }

  private async storeTransaction(transactionDetails: Transaction): Promise<Transaction | undefined> {
    this.transactions.push(transactionDetails);
    return transactionDetails
  }

  private findEmployee(employeeId: string) {
    return this.employees.find(employee => employeeId === employee.employeeId);
  }
}

export class AlwaysFailsTransactionManager implements TransactionManagerClass {
  updateBalance(employeeId: string, amount: number, transactionType: TransactionType, transactionDetails: Transaction | undefined): Promise<Employee | undefined> {
    throw Error('transaction error ' + employeeId)
  }

  retrieveBalance(employeeId: string): Promise<number> {
    throw Error('transaction error ' + employeeId)
  }
}

export class TransactionManager implements TransactionManagerClass {
  constructor(private employeeStore: EmployeeStore, private transactionStore: TransactionStore) {
  }

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType, transactionDetails: Transaction | undefined): Promise<Employee | undefined> {
    if (transactionType === TransactionType.PURCHASE) {
      const employeeBalance = await this.retrieveBalance(employeeId);
      if (employeeBalance && employeeBalance < amount) throw Error('Insufficient funds, please top up to continue');

      if (transactionDetails) await this.storeTransaction(transactionDetails)
    }
    const action = transactionType === TransactionType.TOPUP ? Action.Plus : Action.Minus;
    return await this.employeeStore.update(employeeId, amount, action)
  }

  public async retrieveBalance(employeeId:string): Promise<number> {
    return await this.employeeStore.checkBalance(employeeId);
  }

  private async storeTransaction(transactionDetails:Transaction):Promise<Transaction | undefined> {
    try {
      return await this.transactionStore.store(transactionDetails);
    } catch (e) {
      //ignore error - it shouldn't stop the balance being updated
    }
  }
}
