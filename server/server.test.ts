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
import {InMemoryTransactionManager} from "../src/transactions/TransactionManager";
import {FileHandler} from "../utils/FileHandler";
import {buildToken} from "../src/userAuthtoken/TokenStore";

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
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
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
      expect(JSON.parse(response.bodyString()).firstName).to.eql(employee.firstName);
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
    const topUpAmount = Random.integer(100000)/100;

    it('should retrieve an employee balance', async () => {
      transactionManager.employees.push(buildEmployee({...employee, balance: topUpAmount}));
      tokenManager.tokens.push(buildToken({employeeId: employee.employeeId, value: fixedToken}));

      const response = await httpClient(ReqOf(
        Method.GET,
        `http://localhost:${port}/balance/${employee.employeeId}`,
        undefined,
        {
          ...basicAuthHeaders,
          token: fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(200);
      expect(response.bodyString()).to.eql(`Current balance: ${topUpAmount}`);
    });

    it('should require system auth when getting balance', async () => {
      transactionManager.employees.push(buildEmployee({...employee, balance: topUpAmount}));
      tokenManager.tokens.push(buildToken({employeeId: employee.employeeId, value: fixedToken}));

      const response = await httpClient(ReqOf(
        Method.GET, `http://localhost:${port}/balance/${employee.employeeId}`, undefined, {'token': fixedToken}
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(401);
    });

    it('should require logged in session token when getting balance', async () => {
      transactionManager.employees.push(buildEmployee({...employee, balance: topUpAmount}));
      tokenManager.tokens.push(buildToken({employeeId: employee.employeeId, value: fixedToken}));

      const response = await httpClient(ReqOf(
        Method.GET, `http://localhost:${port}/balance/${employee.employeeId}`, undefined, basicAuthHeaders
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(401);
    });

    it('should allow a user to top up their account', async () => {
      const zeroBalanceEmployee = buildEmployee({balance: 0});
      transactionManager.employees.push(buildEmployee(zeroBalanceEmployee));
      tokenManager.tokens.push(buildToken({employeeId: zeroBalanceEmployee.employeeId, value: fixedToken, }));

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
      const fixedTopUpAmount = 100;
      transactionManager.employees.push(buildEmployee({...employee, balance: fixedTopUpAmount}));
      tokenManager.tokens.push(buildToken({employeeId: employee.employeeId, value: fixedToken, }));

      const paymentAmount = 99.99;
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
      expect(response.bodyString()).to.eql(`New balance is ${(fixedTopUpAmount - paymentAmount).toFixed(2)}`);
    });

    it('should return 500 with an error message if there are insufficient funds for the payment', async() =>{
      const balance = 1.00;
      const paymentAmount = 1.99;
      const employeeWithBalance = buildEmployee({balance});

      transactionManager.employees.push(employeeWithBalance);
      await tokenManager.generateAndStoreToken(employeeWithBalance.employeeId);

      const response = await httpClient(ReqOf(
        Method.PUT,
        `http://localhost:${port}/balance/${employeeWithBalance.employeeId}`,
        JSON.stringify({
          amount: paymentAmount,
          transactionType: 'purchase'
        }),
        {
          ...basicAuthHeaders,
          'token': fixedToken
        }
      ).withPathParamsFromTemplate('/balance/{employeeId}'));

      expect(response.status).to.eql(500); // Payment Required status code - not in general use but seems best fit
      expect(response.bodyString()).to.eql(`Error: Insufficient funds, please top up to continue`);

      const updatedEmployee = transactionManager.employees.find(storedEmployee => storedEmployee.employeeId === employeeWithBalance.employeeId);
      expect(updatedEmployee!.balance).to.eql(balance);
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
