import {buildEmployee, InMemoryEmployeeStore, TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Random} from "../../utils/Random";
import {expect} from "chai";
import {Employee} from "../signup-logIn-logout/SignUpHandler";
import {TransactionManager} from "./TransactionManager";

describe('TransactionManager', () => {
  const employeeStore = new InMemoryEmployeeStore();
  const transactionManager = new TransactionManager(employeeStore);
  const topUpAmount = Random.integer(1000)/10;
  let employee: Employee;

  beforeEach(async () => {
    employee = buildEmployee({balance: undefined});
    await employeeStore.store(employee);
  });

  it('should decide whether to top up or detract from balance', async () => {
    const returnedEmployee = await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.TOPUP);
    expect(returnedEmployee!.balance).to.eql(topUpAmount);
  });

  it('should not allow topup if the employee has insufficient budget', async() => {
    try {
      await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.PURCHASE)
    } catch (e) {
      expect(e.message).to.eql('Insufficient funds, please top up to continue')
    }
  });
});