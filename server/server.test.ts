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
import {FixedTokenGenerator} from "../utils/IdGenerator";
import {InMemoryTokenStore, TokenStore} from "../token/TokenStore";
import {LogOutHandler} from "../signup-logIn-logout/LogOutHandler";

require('dotenv').config();

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let employeeStore: EmployeeStore;
  let tokenStore: TokenStore;
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
  const fixedTokenGenerator = new FixedTokenGenerator();

  beforeEach(async () => {
    employeeStore = new InMemoryEmployeeStore();
    tokenStore = new InMemoryTokenStore();
    signUpHandler = new SignUpHandler(employeeStore);
    fixedTokenGenerator.setToken(fixedToken);
    logInHandler = new LogInHandler(employeeStore, tokenStore, fixedTokenGenerator);
    logOutHandler = new LogOutHandler(tokenStore);
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

  it.skip('should allow logout given an employeeId', async () => {
    await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders));
    // TODO fix signup- needs token!
    const tokens = await tokenStore.findAll();
    expect(tokens[0].employeeId).to.equal(employee.employeeId);
    expect(tokens[0].expiry).to.be.greaterThan(new Date());
    //TODO replace with find method when it exists

    const response = await httpClient(ReqOf(
      Method.GET,
      `http://localhost:${port}/logout`,
      JSON.stringify({employeeId: employee.employeeId}),
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

    const updatedTokens = await tokenStore.findAll();
    expect(updatedTokens[0].employeeId).to.equal(employee.employeeId);
    expect(updatedTokens[0].expiry).to.be.at.most(new Date());
  });

  it('should not error even if the user wasn\'t logged in..', async () => {
    const response = await httpClient(ReqOf(
      Method.GET,
      `http://localhost:${port}/logout`,
      JSON.stringify({employeeId: employee.employeeId}),
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql('Log out successful - Goodbye!');
  });
});
