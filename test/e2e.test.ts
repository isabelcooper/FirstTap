import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "../src/server";
import {Random} from "../utils/Random";
import {SignUpHandler} from "../src/SignUpHandler";
import {buildEmployee, SqlEmployeeStore} from "../src/EmployeeStore";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";

describe.skip('E2E', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let database: PostgresDatabase;

  beforeEach(async () => {
    server = new Server(new SignUpHandler(new SqlEmployeeStore(database)), port);
    server.start();
  });

  afterEach(async () => {
    server.stop();
  });

  it('should allow an unknown user to register', async () =>{
    const employee = buildEmployee({});
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee)));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
  });

});
