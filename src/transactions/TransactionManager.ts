import {Action, EmployeeStore, TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Employee} from "../signup-logIn-logout/SignUpHandler";

export class TransactionManager {
  constructor(private employeeStore: EmployeeStore) {}

  public async updateBalance(employeeId: string, amount: number, transactionType: TransactionType): Promise<Employee | null> {
    if (transactionType === TransactionType.PURCHASE) {
      const employeeBalance = await this.employeeStore.checkBalance(employeeId);
      if (employeeBalance < amount) throw Error('Insufficient funds, please top up to continue');
    }

    const action = transactionType === TransactionType.TOPUP ? Action.Plus : Action.Minus;
    console.log(action);
    return await this.employeeStore.update(employeeId, amount, action)
  }
}
