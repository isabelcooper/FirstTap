import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {SignUpHandler} from "../signup-logIn-logout/SignUpHandler";
import {buildEmployee, EmployeeStore, SqlEmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";
import {InternalAuthenticator} from "../utils/Authenticator";
import {LogInHandler} from "../signup-logIn-logout/LogInHandler";
import {SqlTokenStore, TokenStore} from "../token/TokenStore";
import {LogOutHandler} from "../signup-logIn-logout/LogOutHandler";
import {Random} from "../utils/Random";
import {TokenManager, TokenManagerClass} from "../token/TokenManager";
import {IdGenerator, UniqueUserIdGenerator} from "../utils/IdGenerator";
import {Dates} from "../utils/Dates";

describe('E2E', function () {
  this.timeout(30000);
  const httpClient = HttpClient;
  const port = 3332;
  let database: PostgresDatabase;
  const testPostgresServer = new PostgresTestServer();
  let server: Server;
  let employeeStore: EmployeeStore;
  let tokenStore: TokenStore;
  let idGenerator: IdGenerator;
  let tokenManager: TokenManagerClass;

  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const authHeaders = {'authorization': `Basic ${encodedCredentials}`};
  const employee = buildEmployee();

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    await testPostgresServer.start();

    employeeStore = new SqlEmployeeStore(database);
    tokenStore = new SqlTokenStore(database);

    idGenerator = new UniqueUserIdGenerator();
    tokenManager = new TokenManager(tokenStore, idGenerator);

    signUpHandler = new SignUpHandler(employeeStore);
    logInHandler = new LogInHandler(employeeStore, tokenManager);
    logOutHandler = new LogOutHandler(tokenManager);

    server = new Server(signUpHandler, logInHandler, logOutHandler, authenticator, port);
    await server.start();
  });

  afterEach(async () => {
    await testPostgresServer.stop();
    await server.stop();
  });

  it('should allow an unknown user to register', async () => {
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders),);
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
  });

  it('should allow a known user to log in', async () => {
    await employeeStore.store(employee);
    const response = await httpClient(ReqOf(
      Method.POST,
      `http://localhost:${port}/login`,
      JSON.stringify({employeeId: employee.employeeId, pin: employee.pin}),
      authHeaders
    ));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
    expect(JSON.parse(response.bodyString()).token).to.exist;
  });

  it('should log a user out', async () => {
    const tokenValue = Random.string('token');
    await tokenStore.store(employee.employeeId, tokenValue);

    const response = await httpClient(ReqOf(
      Method.GET,
      `http://localhost:${port}/logout`,
      JSON.stringify({employeeId: employee.employeeId}),
      authHeaders
    ));

    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

    const matchedToken = (await tokenStore.findAll()).find(token => token.employeeId === employee.employeeId);
    //TODO uypdate to find method

    expect(matchedToken!.value).to.eql(tokenValue);
    expect(Dates.stripMillis(matchedToken!.expiry)).to.be.at.most(new Date());
  });
});
