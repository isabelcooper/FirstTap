import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {buildEmployee, EmployeeStore, InMemoryEmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {SignUpHandler} from "../signup-logIn-logout/SignUpHandler";
import {InternalAuthenticator} from "../utils/Authenticator";
import {Random} from "../utils/Random";
import {LogInHandler} from "../signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "../signup-logIn-logout/LogOutHandler";
import {InMemoryTokenManager} from "../token/TokenManager";
import {Dates} from "../utils/Dates";

require('dotenv').config();

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let employeeStore: EmployeeStore;
  // let tokenStore: TokenStore;
  let tokenManager: InMemoryTokenManager;
  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employee = buildEmployee();
  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const authHeaders = {'authorization': `Basic ${encodedCredentials}`};

  const fixedToken = Random.string('token');

  beforeEach(async () => {
    tokenManager = new InMemoryTokenManager();
    employeeStore = new InMemoryEmployeeStore();
    signUpHandler = new SignUpHandler(employeeStore, tokenManager);
    tokenManager.setToken(fixedToken);
    logInHandler = new LogInHandler(employeeStore, tokenManager);
    logOutHandler = new LogOutHandler(tokenManager);
    server = new Server(signUpHandler, logInHandler, logOutHandler, authenticator, port);
    server.start();
  });

  afterEach(async () => {
    server.stop();
  });

  it('should respond 200 on health', async () => {
    const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/health`));
    expect(response.status).to.eql(200);
  });

  it('should allow a new employee to be created and return the name & token of the employee if successful', async() => {
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
  });

  it('should reject signup attempts without system auth credentials', async() => {
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee)));
    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('Client not authenticated');
  });

  it('should allow an existing user to login using employeeId and pin, returning their name', async() => {
    await employeeStore.store(employee);
    const loginDetails = {
      employeeId: employee.employeeId,
      pin: employee.pin
    };
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/login`, JSON.stringify(loginDetails), authHeaders));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
    expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);
  });

  it('should allow logout given an employeeId', async () => {
    await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders));
    expect(tokenManager.tokens[0].employeeId).to.equal(employee.employeeId);
    expect(tokenManager.tokens[0].expiry).to.be.greaterThan(new Date());

    const response = await httpClient(ReqOf(
      Method.POST,
      `http://localhost:${port}/logout`,
      JSON.stringify({employeeId: employee.employeeId}),
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

    expect(tokenManager.tokens[0].employeeId).to.equal(employee.employeeId);
    expect(Dates.stripMillis(tokenManager.tokens[0].expiry)).to.be.at.most(new Date());
  });

  it('should not error even if the user wasn\'t logged in..', async () => {
    const response = await httpClient(ReqOf(
      Method.POST,
      `http://localhost:${port}/logout`,
      JSON.stringify({employeeId: employee.employeeId}),
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql('Log out successful - Goodbye!');
  });

  it.skip('should load swagger docs', async () => {
    const response = await httpClient(ReqOf(
      Method.GET,
      `http://localhost:${port}/docs`,
      undefined,
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.include('<title>FirstTap Api Docs</title>');
  });

  it.skip('should load swagger json', async () => {
    const response = await httpClient(ReqOf(
      Method.GET,
      `http://localhost:${port}/swagger/swagger.json`,
      undefined,
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.include( '"title": "FirstTap Api"');
  });
});
