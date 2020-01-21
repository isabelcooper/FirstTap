import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Employee} from "./SignUpHandler";
import {buildEmployee, InMemoryEmployeeStore} from "./EmployeeStore";
import {LogInHandler} from "./LogInHandler";
import {AlwaysFailsEmployeeStore} from "./SignUpHandler.test";
import {Random} from "../utils/Random";
import {FixedTokenGenerator, UniqueUserIdGenerator} from "../utils/IdGenerator";
import {AlwaysFailsTokenStore, InMemoryTokenStore} from "../token/TokenStore";

describe('LogInHandler', () => {
  const employeeStore = new InMemoryEmployeeStore();
  let fixedTokenGenerator = new FixedTokenGenerator();
  const tokenStore = new InMemoryTokenStore();
  const logInHandler = new LogInHandler(employeeStore, tokenStore, fixedTokenGenerator);
  const employee: Employee = buildEmployee();

  before(async () => {
    await employeeStore.store(employee);
  });

  it('should look up an existing user, returning their name and a generated token', async () => {
    const fixedToken = Random.string('id');
    fixedTokenGenerator.setToken(fixedToken);

    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(employee)
    ));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);

    const storedTokens = await tokenStore.findAll();
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
    const handlerWithFailingStore = new LogInHandler(new AlwaysFailsEmployeeStore(), new InMemoryTokenStore(), new UniqueUserIdGenerator());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error storing new user - please contact your administrator. \n Error: employee not found ${employee}`
    );
  });

  it('should handle errors from the token generator or store', async () => {
    const employee = buildEmployee();
    await employeeStore.store(employee);

    const handlerWithFailingStore = new LogInHandler(employeeStore, new AlwaysFailsTokenStore(), new UniqueUserIdGenerator());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error retrieving token - please contact your administrator.`
    );
  });
});
