import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Employee, SignUpHandler} from "./SignUpHandler";
import {buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "./EmployeeStore";
import {LogInHandler} from "./LogInHandler";
import {AlwaysFailsStore} from "./SignUpHandler.test";
import {Random} from "../utils/Random";
import {FixedIdGenerator, UniqueUserIdGenerator} from "../utils/IdGenerator";

describe('LogInHandler', () => {
  const employeeStore = new InMemoryEmployeeStore();
  let fixedIdGenerator = new FixedIdGenerator();
  const logInHandler = new LogInHandler(employeeStore, fixedIdGenerator);
  const employee: Employee = buildEmployee();

  before(async () => {
    await employeeStore.store(employee);
  });

  it('should look up an existing user and return their name and token', async () => {
    const fixedId = Random.string('id', 10);
    fixedIdGenerator.setId(fixedId);

    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(employee)
    ));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedId);
  });

  it('should error if pin does not match employeeId',async () => {
    const mismatchedEmployee = buildEmployee({employeeId: employee.employeeId});

    const response = await logInHandler.handle(ReqOf(Method.POST, '/login',
      JSON.stringify(mismatchedEmployee)
    ));

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('User not recognised');
  });

  it('should handle errors reading from the store', async () => {
    const employee = buildEmployee();
    const handlerWithFailingStore = new LogInHandler(new AlwaysFailsStore(), new UniqueUserIdGenerator());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error storing new user - please contact your administrator. \n Error: employee not found ${employee}`
    );
  });
});
