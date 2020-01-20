import {buildEmployee, EmployeeStore, SqlEmployeeStore} from "./EmployeeStore";
import {expect} from "chai";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";

describe('EmployeeStore', function() {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let employeeStore: EmployeeStore;
  const employee = buildEmployee({});

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    employeeStore = new SqlEmployeeStore(database);
  });

  afterEach( async() => {
    await testPostgresServer.stop()
  });

  it('should store an employee', async () => {
    await employeeStore.store(employee);
    expect(await employeeStore.findAll()).to.eql([employee])
  });

  it('should find an employee based on employeeId and pin code', async () => {
    await employeeStore.store(employee);
    expect(await employeeStore.find({employeeId: employee.employeeId, pin: employee.pin})).to.eql(employee)
  });
});
