import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {AlwaysFailsEmployeeStore, buildEmployee, Employee, InMemoryEmployeeStore} from "./EmployeeStore";
import {LogInHandler} from "./LogInHandler";
import {Random} from "../../utils/Random";
import {AlwaysFailsTokenManager, InMemoryTokenManager} from "../userAuthtoken/TokenManager";

describe('LogInHandler', () => {
  const employeeStore = new InMemoryEmployeeStore();
  const tokenManager = new InMemoryTokenManager();
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const employee: Employee = buildEmployee();
  const fixedToken = Random.string('token');

  before(async () => {
    await employeeStore.store(employee);
    tokenManager.setToken(fixedToken);
  });

  it('should look up an existing user, returning their name and a generated token', async () => {
    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(employee)
    ));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);

    const storedTokens = await tokenManager.tokens;
    expect(storedTokens[0].employeeId).to.eql(employee.employeeId);
    expect(storedTokens[0].value).to.eql(fixedToken);
  });

  it('should error if pin does not match employeeId',async () => {
    const mismatchedEmployee = buildEmployee({employeeId: employee.employeeId});

    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(mismatchedEmployee)
    ));

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('User not recognised');
  });

  it('should handle errors reading from the employeeStore', async () => {
    const employee = buildEmployee();
    const handlerWithFailingStore = new LogInHandler(new AlwaysFailsEmployeeStore(), tokenManager);
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error: employee not found ${employee.employeeId}`
    );
  });

  it('should handle errors from the token generator or store', async () => {
    const employee = buildEmployee();
    await employeeStore.store(employee);

    const handlerWithFailingStore = new LogInHandler(employeeStore, new AlwaysFailsTokenManager());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error retrieving token - please contact your administrator.`
    );
  });
});
