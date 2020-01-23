import {InMemoryTokenManager} from "../userAuthtoken/TokenManager";
import {
  Action,
  AlwaysFailsEmployeeStore,
  buildEmployee,
  EmployeeStore,
  InMemoryEmployeeStore,
  TransactionType
} from "../signup-logIn-logout/EmployeeStore";
import {Random} from "../../utils/Random";
import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {BalanceHandler} from "./BalanceHandler";
import {Employee} from "../signup-logIn-logout/SignUpHandler";
import {AlwaysFailsTransactionManager, InMemoryTransactionManager, TransactionManager} from "./TransactionManager";

describe('BalanceHandler', () => {
  const fixedToken = Random.string('token');
  const topUpAmount = Random.integer(100000) / 100;
  const tokenManager = new InMemoryTokenManager();
  let transactionManager: InMemoryTransactionManager;

  let employeeStore: EmployeeStore;
  let topUpHandler: BalanceHandler;
  let employee: Employee;

  beforeEach(async () => {
    employee = buildEmployee({balance: 0});
    transactionManager = new InMemoryTransactionManager();
    topUpHandler = new BalanceHandler(tokenManager, transactionManager);
    transactionManager.employees.push(employee);
    tokenManager.setToken(fixedToken);
    await tokenManager.generateAndStoreToken(employee.employeeId);
  });

  it('it should add a given amount to the employee balance if logged in and return the new balance', async () => {
    const response = await topUpHandler.handle(ReqOf(
      Method.PUT,
      `/topup/${employee.employeeId}`,
      JSON.stringify({
        amount: topUpAmount,
        transactionType: TransactionType.TOPUP
      }),
      {
        'token': fixedToken
      }
    ).withPathParamsFromTemplate('/topup/{employeeId}'));

    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql(`New balance is ${topUpAmount}`);
  });

  it('should reject requests that have the wrong token', async () => {
    const response = await topUpHandler.handle(ReqOf(
      Method.PUT,
      `/topup/${employee.employeeId}`,
      JSON.stringify({'amount': topUpAmount}),
      {'token': Random.string('differentToken')}
    ).withPathParamsFromTemplate('/topup/{employeeId}'
    ));

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql(`User not logged in`);
  });

  it('should handle errors in updating the balance', async () => {
    const failingTopUpHandler = new BalanceHandler(tokenManager, new AlwaysFailsTransactionManager());
    const response = await failingTopUpHandler.handle(ReqOf(
      Method.PUT,
      `/topup/${employee.employeeId}`,
      JSON.stringify({'amount': topUpAmount}),
      {
        'token': fixedToken
      }
    ).withPathParamsFromTemplate('/topup/{employeeId}'));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(`Error: transaction error ${employee.employeeId}`);
  });

  it('it should detract a given amount from the employee balance if logged in and return the new balance', async () => {
    const topUpAmount = 100;
    await transactionManager.updateBalance(employee.employeeId, topUpAmount, TransactionType.TOPUP);
    const purchaseAmount = Random.integer(9999)/100;

    const response = await topUpHandler.handle(ReqOf(
      Method.PUT,
      `/topup/${employee.employeeId}`,
      JSON.stringify({
        amount: purchaseAmount,
        transactionType: 'purchase'
      }),
      {
        'token': fixedToken
      }
    ).withPathParamsFromTemplate('/topup/{employeeId}'));

    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql(`New balance is ${topUpAmount - purchaseAmount}`);
  });
});
