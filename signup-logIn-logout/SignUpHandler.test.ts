import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Employee, SignUpHandler} from "./SignUpHandler";
import {buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "./EmployeeStore";

export class AlwaysFailsStore implements EmployeeStore{
  findAll(): Promise<Employee[]> {
    throw Error('findAll broken')
  }

  store(employee: Employee): Promise<{ inserted: boolean }> {
    throw Error('store broken on employee: ' + employee)
  }

  find(loginDetails: { pin: number; employeeId: string }): Promise<Employee> {
    throw Error('employee not found ' + loginDetails)
  }
}

describe('SignUpHandler', () => {
  const employeeStore = new InMemoryEmployeeStore();
  const signUpHandler = new SignUpHandler(employeeStore);

  it('should register a new user and return their name', async () => {
    const employee: Employee = buildEmployee();
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

  it('should handle errors storing new users', async () => {
    const employee = buildEmployee();
    const handlerWithFailingStore = new SignUpHandler(new AlwaysFailsStore());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error storing new user - please contact your administrator. \n Error: store broken on employee: ${employee}`
    );
  });

  //TODO: redirect to login if already a known user
});
