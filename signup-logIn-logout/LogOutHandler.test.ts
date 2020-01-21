import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js";
import {expect} from "chai";
import {buildEmployee} from "./EmployeeStore";
import {Random} from "../utils/Random";
import {LogOutHandler} from "./LogOutHandler";
import {AlwaysFailsTokenManager, InMemoryTokenManager} from "../token/TokenManager";

describe('LogOutHandler', () => {
  const tokenManager = new InMemoryTokenManager();
  const logOutHandler = new LogOutHandler(tokenManager);
  const employee = buildEmployee();
  const fixedToken = Random.string('token');

  beforeEach( async () => {
    await tokenManager.tokens.push({employeeId: employee.employeeId, value: fixedToken, expiry: new Date()});
  });

  it('should expire token immediately and return Goodbye message', async () => {
    const response = await logOutHandler.handle(ReqOf(Method.POST, '/logout', JSON.stringify({employeeId: employee.employeeId})));
    expect(response.status).to.eql(200, 'Log out successful - Goodbye!');

    expect(tokenManager.tokens[0].expiry).to.be.at.most(new Date())
  });

  it('should throw error if store update fails', async () => {
    const logOutHandler = new LogOutHandler(new AlwaysFailsTokenManager());
    const response = await logOutHandler.handle(ReqOf(Method.POST, '/logout', JSON.stringify({employeeId: employee.employeeId})));

    expect(response.status).to.eql(500, 'Log out failed - please contact your administrator.');
  });
});
