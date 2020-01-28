import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {SqlEmployeeStore} from "../signup-logIn-logout/SqlEmployeeStore";
import {buildEmployee, EmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {PostgresTestServer} from "../../database/postgres/PostgresTestServer";
import {Random} from "../../utils/Random";
import {expect} from "chai";
import {SqlTransactionStore} from "./SqlTransactionStore";
import {buildTransaction, TransactionStore} from "./TransactionStore";

describe('TransactionStore', function () {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let transactionStore: TransactionStore;
  let employeeStore: EmployeeStore;
  const employeeId = Random.string('', 16);
  const employee = buildEmployee({employeeId});

  before(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    transactionStore = new SqlTransactionStore(database);

    employeeStore = new SqlEmployeeStore(database);
    await employeeStore.store(employee);
  });

  afterEach(async () => {
    await database.query(`TRUNCATE TABLE transactions;`)
  });

  after( async() => {
    await testPostgresServer.stop()
  });

  it('should store transactions by employee Id', async () => {
    const transaction = buildTransaction({employeeId});
    const returnedTransaction = await transactionStore.store(transaction);

    expect(returnedTransaction!.employeeId).to.eql(transaction.employeeId);
    expect(returnedTransaction!.kioskRef).to.eql(transaction.kioskRef);
    expect(returnedTransaction!.itemRef).to.eql(transaction.itemRef);
    expect(returnedTransaction!.category).to.eql(transaction.category);

    const returnedDate = new Date(returnedTransaction!.transactionTime!);
    expect(returnedDate.getMinutes())
      .to.eql((new Date()).getMinutes());
  });

  it('should read transactions by employee Id', async () => {
    const transaction = buildTransaction({employeeId});
    await transactionStore.store(transaction);
    await transactionStore.store(transaction);
    const differentEmployeeId = Random.string('differentEmployeeId', 16);
    await employeeStore.store(buildEmployee({employeeId: differentEmployeeId}));
    await transactionStore.store(buildTransaction({employeeId: differentEmployeeId}));

    const allTransactionsForEmployee = await transactionStore.findAllByEmployeeId(employeeId);
    expect((allTransactionsForEmployee).length).to.eql(2);

    const firstTransaction = allTransactionsForEmployee[0];

    expect(firstTransaction.employeeId).to.eql(employeeId);
    expect(firstTransaction.kioskRef).to.eql(transaction.kioskRef);
    expect(firstTransaction.itemRef).to.eql(transaction.itemRef);
    expect(firstTransaction.category).to.eql(transaction.category);

    const returnedDate = new Date(firstTransaction!.transactionTime!);
    expect(returnedDate.getMinutes()).to.eql(new Date().getMinutes());
  });
});
