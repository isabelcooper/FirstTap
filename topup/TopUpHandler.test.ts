import {InMemoryTokenManager} from "../userAuthtoken/TokenManager";
import {buildEmployee, InMemoryEmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {Random} from "../utils/Random";
import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {TopUpHandler} from "./TopUpHandler";
import {AlwaysFailsEmployeeStore} from "../signup-logIn-logout/SignUpHandler.test";

describe('TopUpHandler', () => {
  const tokenManager = new InMemoryTokenManager();
  const employeeStore = new InMemoryEmployeeStore();
  const employee = buildEmployee({balance: 0});
  const topUpHandler = new TopUpHandler(tokenManager, employeeStore);
  const fixedToken = Random.string('token');
  const topUpAmount = Random.integer(100000) / 100;

  beforeEach(async () => {
    await employeeStore.store(employee);
    tokenManager.setToken(fixedToken);
    await tokenManager.generateAndStoreToken(employee.employeeId);
  });

  it('it should add a given amount to the employee balance if logged in and return the new balance', async () => {
    const response = await topUpHandler.handle(ReqOf(
      Method.PUT,
      `/topup/${employee.employeeId}`,
      JSON.stringify({'amount': topUpAmount}),
      {
        'token': fixedToken
      }
    ).withPathParamsFromTemplate('/topup/{employeeId}'));

    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql(`Account topped up successfully. New balance is ${topUpAmount}`);
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
    const failingEmployeeStore = new AlwaysFailsEmployeeStore();
    const failingTopUpHandler = new TopUpHandler(tokenManager, failingEmployeeStore);
    const response = await failingTopUpHandler.handle(ReqOf(
      Method.PUT,
      `/topup/${employee.employeeId}`,
      JSON.stringify({'amount': topUpAmount}),
      {
        'token': fixedToken
      }
    ).withPathParamsFromTemplate('/topup/{employeeId}'));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(`Error: employee not found ${employee.employeeId}`);
  });
});
