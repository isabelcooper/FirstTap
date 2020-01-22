import {buildEmployee, EmployeeStore, SqlEmployeeStore} from "./EmployeeStore";
import {expect} from "chai";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";
import {Random} from "../utils/Random";

describe('EmployeeStore', function() {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let employeeStore: EmployeeStore;
  const employee = buildEmployee();

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

  it('should update an employee balance given a new top up amount', async () => {
    await employeeStore.store(employee);
    const amountToTopUp = Random.integer(1000)/100;
    const updatedEmployee = await employeeStore.update(employee.employeeId, amountToTopUp);
    expect(updatedEmployee).to.eql({
      ...employee,
      balance: amountToTopUp + employee.balance,
    })
  });
});
