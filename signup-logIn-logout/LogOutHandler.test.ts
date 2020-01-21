import {AlwaysFailsTokenStore, InMemoryTokenStore} from "../token/TokenStore";
import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js";
import {expect} from "chai";
import {buildEmployee} from "./EmployeeStore";
import {Random} from "../utils/Random";
import {LogOutHandler} from "./LogOutHandler";

describe('LogOutHandler', () => {
  const tokenStore = new InMemoryTokenStore();
  const logOutHandler = new LogOutHandler(tokenStore);
  const employee = buildEmployee();
  const fixedToken = Random.string('token');

  beforeEach( async () => {
    await tokenStore.store(employee.employeeId, fixedToken)
  });

  it('should expire token immediately and return Goodbye message', async () => {
    const originalStoredTokens = await tokenStore.findAll();
    expect(originalStoredTokens[0].expiry).to.be.greaterThan(new Date());

    const response = await logOutHandler.handle(ReqOf(Method.POST, '/logout', JSON.stringify({employeeId: employee.employeeId})));
    expect(response.status).to.eql(200, 'Log out successful - Goodbye!');

    const updatedStoredTokens = await tokenStore.findAll();
    expect(updatedStoredTokens[0].expiry).to.be.at.most(new Date())
  });

  it('should throw error if store update fails', async () => {
    const logOutHandler = new LogOutHandler(new AlwaysFailsTokenStore());
    const response = await logOutHandler.handle(ReqOf(Method.POST, '/logout', JSON.stringify({employeeId: employee.employeeId})));

    expect(response.status).to.eql(500, 'Log out failed - please contact your administrator.');
  });
});
