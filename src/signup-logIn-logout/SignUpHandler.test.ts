import {ReqOf} from "http4js/core/Req";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Employee, SignUpHandler} from "./SignUpHandler";
import {AlwaysFailsEmployeeStore, buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "./EmployeeStore";
import {AlwaysFailsTokenManager, InMemoryTokenManager} from "../userAuthtoken/TokenManager";
import {Random} from "../../utils/Random";


describe('SignUpHandler', () => {
  let employeeStore: EmployeeStore;
  let tokenManager: InMemoryTokenManager;
  let signUpHandler: SignUpHandler;
  const fixedToken = Random.string('token');
  const employee: Employee = buildEmployee();

  beforeEach(() => {
    employeeStore = new InMemoryEmployeeStore();
    tokenManager = new InMemoryTokenManager();
    signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  });

  it('should register a new user and return their name and a token', async () => {
    tokenManager.setToken(fixedToken);
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(employee)));

    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);
    expect( await employeeStore.findAll()).to.eql([employee])
  });

  it('should not allow an existing user to sign up a second time',async () =>{
    await signUpHandler.handle(ReqOf(Method.POST, '/login', JSON.stringify(employee)));

    const employeeWithSameId = buildEmployee({employeeId: employee.employeeId});
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(employeeWithSameId)));

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('User already registered, please log in');
  });

  it('should error if required sign up info is missing',async () => {
    const brokenEmployee = buildEmployee({employeeId: undefined});
    const response = await signUpHandler.handle(ReqOf(Method.POST, '/signup', JSON.stringify(brokenEmployee)));

    expect(response.status).to.eql(400);
    expect(response.bodyString()).to.eql('Bad request - missing required employee details');
  });

  it('should handle errors storing new users', async () => {
    const handlerWithFailingStore = new SignUpHandler(new AlwaysFailsEmployeeStore(), tokenManager);
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/signup', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error storing new user - please contact your administrator. \n Error: store broken on employee: ${employee}`
    );
  });

  it('should handle errors from the token generator or store', async () => {
    const handlerWithFailingStore = new SignUpHandler(employeeStore, new AlwaysFailsTokenManager());
    const response = await handlerWithFailingStore.handle(ReqOf(Method.POST, '/signup', JSON.stringify(employee)));

    expect(response.status).to.eql(500);
    expect(response.bodyString()).to.eql(
      `Error retrieving token - please contact your administrator.`
    );
  });
});
