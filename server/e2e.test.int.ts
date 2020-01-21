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
import {UniqueUserIdGenerator} from "../utils/IdGenerator";
import {SqlTokenStore} from "../token/TokenStore";

describe('E2E', function() {
  this.timeout(30000);
  const httpClient = HttpClient;
  const port = 3332;
  let database: PostgresDatabase;
  const testPostgresServer = new PostgresTestServer();
  let server: Server;
  let employeeStore: EmployeeStore;

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

    server = new Server(new SignUpHandler(employeeStore), new LogInHandler(employeeStore, new SqlTokenStore(database), new UniqueUserIdGenerator()), authenticator, port);
    await server.start();
  });

  afterEach(async () => {
    await testPostgresServer.stop();
    await server.stop();
  });

  it('should allow an unknown user to register', async () =>{
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

});
