import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {SignUpHandler} from "../signup-logIn-logout/SignUpHandler";
import {InternalAuthenticator} from "../utils/Authenticator";
require('dotenv').config();

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let employeeStore: EmployeeStore;
  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employee = buildEmployee({});
  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const authHeaders = {'authorization': `Basic ${encodedCredentials}`};

  beforeEach(async () => {
    employeeStore = new InMemoryEmployeeStore();
    server = new Server(new SignUpHandler(employeeStore), authenticator, port);
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
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
  });

  it('should reject signup attempts without system auth credentials', async() => {
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee)));
    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('Client not authenticated');
  });
});
