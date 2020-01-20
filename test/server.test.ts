import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "../src/server";
import {buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "../src/EmployeeStore";
import {SignUpHandler} from "../src/SignUpHandler";

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let employeeStore: EmployeeStore;

  beforeEach(async () => {
    employeeStore = new InMemoryEmployeeStore();
    server = new Server(new SignUpHandler(employeeStore), port);
    server.start();
  });

  afterEach(async () => {
    server.stop();
  });

  it('should respond 200 on health', async () => {
    const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/health`));
    expect(response.status).to.eql(200);
  });

  it('should allow a new employee to be created and return the name of the employee if successful', async() => {
    const employee = buildEmployee({});
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee)));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
  });

  // TODO: complete server tests for employee storage once DB fully set up
  // it('should escalate creation issues on the employee signup endpoint', async () => {} )
  // it('should error if auth fails', async () => {} )

});
