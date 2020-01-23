import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "./server";
import {
  buildEmployee,
  EmployeeStore,
  InMemoryEmployeeStore,
  TransactionType
} from "../src/signup-logIn-logout/EmployeeStore";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {InternalAuthenticator} from "../src/systemAuth/Authenticator";
import {Random} from "../utils/Random";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {InMemoryTokenManager} from "../src/userAuthtoken/TokenManager";
import {Dates} from "../utils/Dates";
import {BalanceHandler} from "../src/transactions/BalanceHandler";
import {InMemoryTransactionManager, TransactionManager} from "../src/transactions/TransactionManager";
import {FileHandler} from "../utils/FileHandler";

require('dotenv').config();

describe('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;
  let employeeStore: EmployeeStore;
  let tokenManager: InMemoryTokenManager;
  let transactionManager: InMemoryTransactionManager;
  let signUpHandler: SignUpHandler;
  let logInHandler: LogInHandler;
  let logOutHandler: LogOutHandler;
  let topUpHandler: BalanceHandler;
  const fileHandler = new FileHandler();

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employee = buildEmployee({balance: undefined});
  const encodedCredentials = Buffer.from(`${process.env.FIRSTTAP_CLIENT_USERNAME}:${process.env.FIRSTTAP_CLIENT_PASSWORD}`).toString('base64');
  const basicAuthHeaders = {'authorization': `Basic ${encodedCredentials}`};

  const fixedToken = Random.string('token');

  beforeEach(async () => {
    tokenManager = new InMemoryTokenManager();
    transactionManager = new InMemoryTransactionManager();
    employeeStore = new InMemoryEmployeeStore();
    signUpHandler = new SignUpHandler(employeeStore, tokenManager);
    tokenManager.setToken(fixedToken);
    logInHandler = new LogInHandler(employeeStore, tokenManager);
    logOutHandler = new LogOutHandler(tokenManager);
    topUpHandler = new BalanceHandler(tokenManager, transactionManager);
    server = new Server(authenticator, signUpHandler, logInHandler, logOutHandler, topUpHandler, fileHandler, port);
    server.start();
  });

  afterEach(async () => {
    server.stop();
  });

  it('should respond 200 on health', async () => {
    const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/health`));
    expect(response.status).to.eql(200);
  });

  describe('Signing up, logging in and out', () => {
    it('should allow a new employee to be created and return the name & token of the employee if successful', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), basicAuthHeaders));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
      expect(JSON.parse(response.bodyString()).token).to.exist;
    });

    it('should reject signup attempts without system auth credentials', async () => {
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee)));
      expect(response.status).to.eql(401);
      expect(response.bodyString()).to.eql('Client not authenticated');
    });

    it('should allow an existing user to login using employeeId and pin, returning their name', async () => {
      await employeeStore.store(employee);
      const loginDetails = {
        employeeId: employee.employeeId,
        pin: employee.pin
      };
      const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/login`, JSON.stringify(loginDetails), basicAuthHeaders));
      expect(response.status).to.eql(200);
      expect(JSON.parse(response.bodyString()).name).to.eql(employee.name);
      expect(JSON.parse(response.bodyString()).token).to.eql(fixedToken);
    });

    it('should allow logout given an employeeId', async () => {
      await httpClient(ReqOf(Method.POST, `http://localhost:${port}/signup`, JSON.stringify(employee), basicAuthHeaders));
      expect(tokenManager.tokens[0].employeeId).to.equal(employee.employeeId);
      expect(tokenManager.tokens[0].expiry).to.be.greaterThan(new Date());

      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({employeeId: employee.employeeId}),
        basicAuthHeaders
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');

      expect(tokenManager.tokens[0].employeeId).to.equal(employee.employeeId);
      expect(Dates.stripMillis(tokenManager.tokens[0].expiry)).to.be.at.most(new Date());
    });

    it('should not error on logout even if the user wasn\'t logged in..', async () => {
      const response = await httpClient(ReqOf(
        Method.POST,
        `http://localhost:${port}/logout`,
        JSON.stringify({employeeId: employee.employeeId}),
        basicAuthHeaders
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql('Log out successful - Goodbye!');
    });
  });

  describe('Amending balance', () => {
    it('should allow a user to top up their account', async () => {
      const zeroBalanceEmployee = buildEmployee({balance: 0});
      await tokenManager.generateAndStoreToken(zeroBalanceEmployee.employeeId);
      await employeeStore.store(zeroBalanceEmployee);
      await transactionManager.employees.push(zeroBalanceEmployee);

      const topUpAmount = Random.number();
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${zeroBalanceEmployee.employeeId}`,
        JSON.stringify({
          amount: topUpAmount,
          transactionType: TransactionType.TOPUP
        }),
        {
          ...basicAuthHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql(`New balance is ${(topUpAmount).toFixed(2)}`);
    });

    it('should detract from the user balance according to their payment', async () => {
      await tokenManager.generateAndStoreToken(employee.employeeId);
      await employeeStore.store(employee);
      await transactionManager.employees.push(employee);

      const topUpAmount = 100;

      await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: topUpAmount,
          transactionType: 'payment'
        }),
        {
          ...basicAuthHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      const paymentAmount = Random.number(1000)/10;
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: paymentAmount,
          transactionType: 'purchase'
        }),
        {
          ...basicAuthHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql(`New balance is ${(topUpAmount - paymentAmount).toFixed(2)}`);
    });

    it('should error if no system auth is present', async () => {
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: Random.integer(100),
          transactionType: TransactionType.TOPUP
        }),
        {
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(401);
      expect(response.bodyString()).to.eql('Client not authenticated');
    });

    it('should error if user is not logged in', async() =>{
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: Random.integer(100),
          transactionType: TransactionType.TOPUP
        }),
        basicAuthHeaders
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(401);
      expect(response.bodyString()).to.eql('User not logged in');
    });

    it('should error if token is not valid', async() =>{
      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        JSON.stringify({
          amount: Random.integer(100),
          transactionType: TransactionType.TOPUP
        }),
        {
          ...basicAuthHeaders,
          token: Random.string('token'),
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(401);
      expect(response.bodyString()).to.eql('User not logged in');
    });
  });

  describe('Loading docs', () => {
    it('should load docs home', async () => {
      const response = await httpClient(ReqOf(
        Method.GET,
        `http://localhost:${port}/docs`,
        undefined,
        basicAuthHeaders
      ));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('<title>FirstTap API documentation</title>');
    });

    it('should load privacy policy (no auth needed)', async () => {
      const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/docs/privacy`));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('<title>FirstTap Privacy Policy</title>');
    });

    it('should load privacy policy css (no auth needed)', async () => {
      const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/docs/style.css`));
      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.include('font-family: "Helvetica Neue"');
    });

    it('should require basic auth on docs home',async () => {
      const response = await httpClient(ReqOf(Method.GET, `http://localhost:${port}/docs`));

      expect(response.status).to.eql(401);
      expect(response.bodyString()).to.eql('Client not authenticated');
    });
  });
});
