import {Random} from "../utils/Random";
import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Employee, SignUpHandler} from "../src/SignUpHandler";

function buildEmployee(partial: Partial<Employee>) {
  return {
    name: Random.string('name'),
    email: Random.string('email'),
    employeeId: Random.string('employeeId'),
    mobile: Random.string('mobile'),
    pin: Random.integer(9999),
    ...partial
  };
}

describe('SignUpHandler', () => {
  const signUpHandler = new SignUpHandler();


  it('should register a new user', async () => {
    const body: Employee = buildEmployee({
        name: Random.string('name')
      }
    );
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/login', JSON.stringify(body)));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(body.name);
  });

  it('should error if required sign up info is missing',async () => {
    const body = buildEmployee({employeeId: null});
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/login', JSON.stringify(body)));

    expect(response.status).to.eql(400);
    expect(response.bodyString()).to.eql('Bad request - missing required employee details');
  });

  // redirect to login if already a known user
});
