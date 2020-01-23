import {Action, EmployeeStore, TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Employee} from "../signup-logIn-logout/SignUpHandler";

export interface TransactionManagerClass {
  updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | null>;
}

export class InMemoryTransactionManager implements TransactionManagerClass {
  public employees: Employee[] = [];

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | null> {
    const updateThisEmployee = this.employees.find(employee => employeeId === employee.employeeId);

    if (!updateThisEmployee) return null;
    if (updateThisEmployee.balance === undefined) updateThisEmployee.balance = amount;
    else if (transactionType === TransactionType.TOPUP) updateThisEmployee.balance += amount;
    else if (transactionType === TransactionType.PURCHASE) {
      if (updateThisEmployee.balance >= amount) {
        updateThisEmployee.balance -= amount
      } else {
        throw new Error('Insufficient funds, please top up to continue')
      }
    }
    return updateThisEmployee
    //TODO simplify or split out? also not updating array!
  }
}

export class AlwaysFailsTransactionManager implements TransactionManagerClass {
  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | null> {
    throw Error('transaction error ' + employeeId)
  }
}

export class TransactionManager implements TransactionManagerClass {
  constructor(private employeeStore: EmployeeStore) {}

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | null> {
    if (transactionType === TransactionType.PURCHASE) {
      const employeeBalance = await this.employeeStore.checkBalance(employeeId);
      if (employeeBalance < amount) throw Error('Insufficient funds, please top up to continue');
    }

    const action = transactionType === TransactionType.TOPUP ? Action.Plus : Action.Minus;
    return await this.employeeStore.update(employeeId, amount, action)
  }
}
