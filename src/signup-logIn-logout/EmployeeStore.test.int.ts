import {Action, buildEmployee, EmployeeStore, SqlEmployeeStore} from "./EmployeeStore";
import {expect} from "chai";
import {PostgresTestServer} from "../../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Random} from "../../utils/Random";

describe('EmployeeStore',function() {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let employeeStore: EmployeeStore;
  const employee = buildEmployee({balance: undefined});
  const amountToTopUp = Random.integer(1000)/100;

  before(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    employeeStore = new SqlEmployeeStore(database);
  });

  afterEach(async () => {
    await database.query(`TRUNCATE TABLE employees;`)
  });

  after( async() => {
    await testPostgresServer.stop()
  });

  it('should store an employee', async () => {
    const storedEmployee = await employeeStore.store(employee);
    expect(storedEmployee).to.eql({
      ...employee,
      balance: 0
    });
  });

  it('should retrieve all employees', async () => {
    await employeeStore.store(employee);
    expect(await employeeStore.findAll()).to.eql([{
      ...employee,
      balance: 0
    }])
  });

  it('should find an employee based on employeeId and pin code', async () => {
    await employeeStore.store(employee);
    expect(await employeeStore.find({employeeId: employee.employeeId, pin: employee.pin})).to.eql({
      ...employee,
      balance: 0
    })
  });

  it('should update an employee balance given a new top up amount', async () => {
    await employeeStore.store(employee);
    const updatedEmployee = await employeeStore.update(employee.employeeId, amountToTopUp, Action.Plus);
    expect(updatedEmployee).to.eql({
      ...employee,
      balance: amountToTopUp,
    })
  });

  it('should detract from employee balance given a transaction amount', async () => {
    await employeeStore.store(employee);
    await employeeStore.update(employee.employeeId, amountToTopUp, Action.Plus);

    const amountToDetract = Random.integer(1000)/100;
    const updatedEmployee = await employeeStore.update(employee.employeeId, amountToDetract, Action.Minus);

    expect(updatedEmployee).to.eql({
      ...employee,
      balance: amountToTopUp - amountToDetract
    });
  });

  it('should check the balance for a user', async() => {
    await employeeStore.store(employee);
    await employeeStore.update(employee.employeeId, amountToTopUp, Action.Plus);
    const balance = await employeeStore.checkBalance(employee.employeeId);
    expect(parseFloat(balance.toFixed(2))).to.eql(amountToTopUp);
  });
});
