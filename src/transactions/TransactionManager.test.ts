import {
  Action,
  buildEmployee,
  Employee,
  InMemoryEmployeeStore,
  TransactionType
} from "../signup-logIn-logout/EmployeeStore";
import {Random} from "../../utils/Random";
import {expect} from "chai";
import {TransactionManager} from "./TransactionManager";
import {buildTransaction, InMemoryTransactionStore} from "./TransactionStore";

describe('TransactionManager', () => {
  const employeeStore = new InMemoryEmployeeStore();
  const transactionStore = new InMemoryTransactionStore();
  const transactionManager = new TransactionManager(employeeStore, transactionStore);
  const topUpAmount = Random.integer(1000)/10;
  let employee: Employee;

  beforeEach(async () => {
    employee = buildEmployee();
    await employeeStore.store(employee);
  });

  it('should retrieve an employee balance', async() => {
    await employeeStore.update(employee.employeeId, topUpAmount, Action.Plus);
    const employeeBalance = await transactionManager.retrieveBalance(employee.employeeId);
    expect(employeeBalance).to.eql(topUpAmount);
  });

  it('should decide whether to top up or detract from balance', async () => {
    const returnedEmployee = await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.TOPUP, undefined);
    expect(returnedEmployee!.balance).to.eql(topUpAmount);
  });

  it('should store transaction details if present',async () =>{
    const transactionDetails = buildTransaction({employeeId: employee.employeeId});
    await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.PURCHASE, transactionDetails);
    const transactions = await transactionStore.findAllByEmployeeId(employee.employeeId);

    expect(transactions.length).to.eql(1);
    expect(transactions[0].employeeId).to.eql(employee.employeeId);
  });

  it('should ignore errors storing transaction',async () =>{
    await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.PURCHASE, undefined);
    const transactions = await transactionStore.findAllByEmployeeId(employee.employeeId);

    expect(transactions.length).to.eql(0);
  });

  it('should not allow topup if the employee has insufficient budget', async() => {
    try {
      await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.PURCHASE, undefined)
    } catch (e) {
      expect(e.message).to.eql('Insufficient funds, please top up to continue')
    }
  });
});
