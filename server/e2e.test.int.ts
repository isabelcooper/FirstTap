import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {Random} from "../utils/Random";
import {SignUpHandler} from "../signup-logIn-logout/SignUpHandler";
import {buildEmployee, SqlEmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";
import {PostgresMigrator} from "../database/postgres/PostgresMigrator";
import {EVENT_STORE_CONNECTION_DETAILS} from "../config/prod";
import {Pool} from "pg";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";

describe('E2E', function() {
  this.timeout(30000);
  const httpClient = HttpClient;
  const port = 3332;
  let database: PostgresDatabase;
  const testPostgresServer = new PostgresTestServer();
  let server: Server;

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    await testPostgresServer.start();

    server = new Server(new SignUpHandler(new SqlEmployeeStore(database)), port);
    await server.start();
  });

  afterEach(async () => {
    await testPostgresServer.stop();
    await server.stop();
  });

  it('should allow an unknown user to register', async () =>{
    const employee = buildEmployee({});
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee)));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
  });

});
