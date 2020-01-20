import {Random} from "../utils/Random";
import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Employee, SignUpHandler} from "../src/SignUpHandler";
import {buildEmployee, InMemoryEmployeeStore} from "../src/EmployeeStore";

describe('SignUpHandler', () => {
  const employeeStore = new InMemoryEmployeeStore();
  const signUpHandler = new SignUpHandler(employeeStore);

  it('should register a new user and return their name', async () => {
    const employee: Employee = buildEmployee({
        name: Random.string('name')
      }
    );
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
    expect( await employeeStore.findAll()).to.eql([employee])
  });

  it('should error if required sign up info is missing',async () => {
    const body = buildEmployee({employeeId: null});
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/login', JSON.stringify(body)));

    expect(response.status).to.eql(400);
    expect(response.bodyString()).to.eql('Bad request - missing required employee details');
  });

  //TODO: redirect to login if already a known user
});
