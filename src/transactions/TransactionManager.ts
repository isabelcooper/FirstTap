import {Action, Employee, EmployeeStore, TransactionType} from "../signup-logIn-logout/EmployeeStore";

export interface TransactionManagerClass {
  updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | undefined>;

  retrieveBalance(employeeId: string): Promise<number>;
}

export class InMemoryTransactionManager implements TransactionManagerClass {
  public employees: Employee[] = [];

  public async retrieveBalance(employeeId: string): Promise<number> {
    const matchedEmployee = this.findEmployee(employeeId);
    return matchedEmployee && matchedEmployee.balance ? matchedEmployee.balance : 0;
  }

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | undefined> {
    const updateThisEmployee = this.findEmployee(employeeId);

    if (!updateThisEmployee) return;
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

  private findEmployee(employeeId: string) {
    return this.employees.find(employee => employeeId === employee.employeeId);
  }
}

export class AlwaysFailsTransactionManager implements TransactionManagerClass {
  updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | undefined> {
    throw Error('transaction error ' + employeeId)
  }

  retrieveBalance(employeeId: string): Promise<number> {
    throw Error('transaction error ' + employeeId)
  }
}

export class TransactionManager implements TransactionManagerClass {
  constructor(private employeeStore: EmployeeStore) {}

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | undefined> {
    if (transactionType === TransactionType.PURCHASE) {
      const employeeBalance = await this.retrieveBalance(employeeId);
      if (employeeBalance < amount) throw Error('Insufficient funds, please top up to continue');
    }

    const action = transactionType === TransactionType.TOPUP ? Action.Plus : Action.Minus;
    return await this.employeeStore.update(employeeId, amount, action)
  }

  public async retrieveBalance(employeeId: string): Promise<number> {
    return await this.employeeStore.checkBalance(employeeId)
  }
}
