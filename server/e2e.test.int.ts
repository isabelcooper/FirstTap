import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {Action, buildEmployee, EmployeeStore, TransactionType} from "../src/signup-logIn-logout/EmployeeStore";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";
import {InternalAuthenticator} from "../src/systemAuth/Authenticator";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {TokenStore} from "../src/userAuthtoken/TokenStore";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {Random} from "../utils/Random";
import {TokenManager, TokenManagerClass} from "../src/userAuthtoken/TokenManager";
import {FixedTokenGenerator, IdGenerator, UniqueUserIdGenerator} from "../utils/IdGenerator";
import {Dates} from "../utils/Dates";
import {BalanceHandler} from "../src/transactions/BalanceHandler";
import {TransactionManager, TransactionManagerClass} from "../src/transactions/TransactionManager";
import {FileHandler} from "../utils/FileHandler";
import {FixedClock} from "../utils/Clock";
import {SqlTokenStore} from "../src/userAuthtoken/SqlTokenStore";
import {SqlEmployeeStore} from "../src/signup-logIn-logout/SqlEmployeeStore";
import {SqlTransactionStore} from "../src/transactions/SqlTransactionStore";
import {buildTransaction, TransactionStore} from "../src/transactions/TransactionStore";

describe('E2E', function () {
  this.timeout(30000);
  const httpClient = HttpClient;
  const port = 3332;
  let database: PostgresDatabase;
  const testPostgresServer = new PostgresTestServer();
  let server: Server;
  let employeeStore: EmployeeStore;
  let tokenStore: TokenStore;
  let transactionStore: TransactionStore;
  let idGenerator: IdGenerator;
  let tokenManager: TokenManagerClass;
  let transactionManager: TransactionManagerClass;

  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;
  let topUpHandler: BalanceHandler;
  const fileHandler = new FileHandler();

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });
  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const authHeaders = {'authorization': `Basic ${encodedCredentials}`};
  const employee = buildEmployee();
  const fixedToken = Random.string('token');
  const clock = new FixedClock();

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    await testPostgresServer.start();

    employeeStore = new SqlEmployeeStore(database);
    tokenStore = new SqlTokenStore(database);

    idGenerator = new UniqueUserIdGenerator();
    tokenManager = new TokenManager(tokenStore, idGenerator, clock);

    signUpHandler = new SignUpHandler(employeeStore, tokenManager);
    logInHandler = new LogInHandler(employeeStore, tokenManager);
    logOutHandler = new LogOutHandler(tokenManager);
    transactionStore = new SqlTransactionStore(database);
    transactionManager = new TransactionManager(employeeStore, transactionStore);
    topUpHandler = new BalanceHandler(tokenManager, transactionManager);

    server = new Server(authenticator, signUpHandler, logInHandler, logOutHandler, topUpHandler, fileHandler, port);
    await server.start();
  });

  afterEach(async () => {
    await testPostgresServer.stop();
    await server.stop();
  });

  describe('Sign up, log in and out', async () => {
    it('should allow an unknown user to register, but not twice', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders),);
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);

      const employeeSameId = buildEmployee({employeeId: employee.employeeId});
      const response2 = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employeeSameId), authHeaders),);
      expect(response2.status).to.eql(401);
    });

    it('should not require a last name on registration', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), authHeaders),);
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
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
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
      expect(JSON.parse(response.bodyString()).token).to.exist;
    });

    it('should log a user out', async () => {
      await employeeStore.store(employee);
      await tokenStore.store(employee.employeeId, fixedToken, 5);

      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({employeeId: employee.employeeId}),
        authHeaders
      ));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

      const matchedToken = (await tokenStore.find(employee.employeeId, fixedToken))[0];

      expect(matchedToken!.value).to.eql(fixedToken);
      expect(Dates.stripMillis(matchedToken!.expiry)).to.be.at.most(new Date());
    });
  });

  describe('Updating a user balance', () => {
    const fixedIdGenerator = new FixedTokenGenerator();
    const fixedToken = Random.string();
    const topUpAmount = Random.integer(100000) / 100;

    beforeEach(async () => {
      fixedIdGenerator.setToken(fixedToken);
      tokenManager = new TokenManager(tokenStore, fixedIdGenerator, Date);

      signUpHandler = new SignUpHandler(employeeStore, tokenManager);
      logInHandler = new LogInHandler(employeeStore, tokenManager);
      logOutHandler = new LogOutHandler(tokenManager);
      topUpHandler = new BalanceHandler(tokenManager, transactionManager);
      await employeeStore.store(employee);
      await tokenManager.generateAndStoreToken(employee.employeeId);
    });

    it('should update a user balance', async () => {
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: topUpAmount,
          transactionType: TransactionType.TOPUP
        }),
        {
          ...authHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql(`Your balance: ${(topUpAmount).toFixed(2)}`);
    });

    it('should detract from a user balance', async () => {
      await employeeStore.update(employee.employeeId, topUpAmount, Action.Plus);

      const purchaseAmount = Random.integer(100) / 10;
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: purchaseAmount,
          transactionType: TransactionType.PURCHASE
        }),
        {
          ...authHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql(`Your balance: ${(topUpAmount - purchaseAmount).toFixed(2)}`);
    });

    it("should not allow payment if the user has less money than the cost", async () => {
      const amount = 10;
      const purchaseAmount = 10.01;
      await employeeStore.update(employee.employeeId, amount, Action.Plus);

      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: purchaseAmount,
          transactionType: TransactionType.PURCHASE
        }),
        {
          ...authHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(500);
      expect(response.bodyString()).to.eql(`Error: Insufficient funds, please top up to continue`);
    });

    it('should refresh the expiry on each api request', async () => {
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: Random.integer(100),
          transactionType: TransactionType.TOPUP
        }),
        {
          ...authHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      clock.moveForwardMins(5);

      expect(response.status).to.eql(200);

      const tokens = await tokenStore.find(employee.employeeId, fixedToken);
      expect(tokens.length).to.eql(1);
      expect(tokens[0].expiry).to.be.greaterThan(new Date(clock.now()));
    });

    it('should retrieve an employee balance', async () => {
      await employeeStore.update(employee.employeeId, topUpAmount, Action.Plus);

      const response = await httpClient(ReqOf(
        Method.GET,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        undefined,
        {
          ...authHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql(`Your balance: ${topUpAmount.toFixed(2)}`);
    });
  });
  describe('Storing user transaction history', () => {
    const fixedIdGenerator = new FixedTokenGenerator();
    const fixedToken = Random.string();
    const topUpAmount = Random.integer(100000) / 100;

    beforeEach(async () => {
      fixedIdGenerator.setToken(fixedToken);
      tokenManager = new TokenManager(tokenStore, fixedIdGenerator, Date);

      signUpHandler = new SignUpHandler(employeeStore, tokenManager);
      logInHandler = new LogInHandler(employeeStore, tokenManager);
      logOutHandler = new LogOutHandler(tokenManager);
      topUpHandler = new BalanceHandler(tokenManager, transactionManager);
      await employeeStore.store(employee);
      await tokenManager.generateAndStoreToken(employee.employeeId);
    });

    it('should store transaction details if provided on purchase', async () => {
      await employeeStore.update(employee.employeeId, topUpAmount, Action.Plus);
      const purchaseAmount = Random.integer(100) / 10;

      const transactionDetails = buildTransaction({employeeId: undefined});

      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: purchaseAmount,
          transactionType: TransactionType.PURCHASE,
          transactionDetails
        }),
        {
          ...authHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      const storedTransactions = await transactionStore.findAllByEmployeeId(employee.employeeId);
      const firstTransaction = storedTransactions[0];

      expect(firstTransaction.employeeId).to.eql(employee.employeeId);
      expect(firstTransaction.amount).to.eql(purchaseAmount);
      expect(firstTransaction.kioskRef).to.eql(transactionDetails.kioskRef);
      expect(firstTransaction.itemRef).to.eql(transactionDetails.itemRef);
      expect(firstTransaction.category).to.eql(transactionDetails.category);
    });
  });
});
