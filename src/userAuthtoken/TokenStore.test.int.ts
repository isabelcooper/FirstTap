import {Random} from "../../utils/Random";
import {expect} from "chai";
import {SqlTokenStore, TokenStore} from "./TokenStore";
import {Dates} from "../../utils/Dates";
import {PostgresTestServer} from "../../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {SqlEmployeeStore} from "../signup-logIn-logout/EmployeeStore";

describe('TokenStore', function () {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let tokenStore: TokenStore;
  const employeeId = Random.string('', 16);
  const value = Random.string();

  before(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    tokenStore = new SqlTokenStore(database);
  });

  afterEach(async () => {
    await database.query(`TRUNCATE TABLE tokens;`)
  });

  after( async() => {
    await testPostgresServer.stop()
  });

  it('should store tokens with expiry in 5 mins and employeeId', async () => {
    const storedToken = await tokenStore.store(employeeId, value);
    expect(storedToken.employeeId).to.eql(employeeId);
    expect(storedToken.value).to.eql(value);

    const dateTimeIn5Minutes = Dates.addMinutes(new Date(), 5);

    const tokens = await tokenStore.findAll();
    expect(tokens[0].employeeId).to.eql(employeeId);
    expect(tokens[0].value).to.eql(value);
    expect(tokens[0].expiry.getDate()).to.eql(dateTimeIn5Minutes.getDate());
    expect(tokens[0].expiry.getMinutes()).to.eql(dateTimeIn5Minutes.getMinutes());

    //TODO: sense check datetime manipulation - could the timezone impact login windows?
  });

  it('should update a token expiry date to now', async () => {
    await tokenStore.store(employeeId, value);
    await tokenStore.expireAll(employeeId);

    const tokens = await tokenStore.findAll();
    expect(tokens[0].employeeId).to.eql(employeeId);
    expect(tokens[0].value).to.eql(value);
    expect(tokens[0].expiry.getDate()).to.eql(new Date().getDate());
    expect(tokens[0].expiry.getMinutes()).to.eql(new Date().getMinutes());
  });

  it('should not be messing with other tokens on update', async () => {
    await tokenStore.store(employeeId, value);
    const employee2Id = Random.string('employee2', 16);
    await tokenStore.store(employee2Id, Random.string());

    await tokenStore.expireAll(employeeId);
    const dateTimeIn5Minutes = Dates.addMinutes(new Date(), 5);

    const employee2Token = (await tokenStore.findAll()).find(token => token.employeeId === employee2Id);
    expect(employee2Token!.employeeId).to.eql(employee2Id);
    expect(employee2Token!.expiry.getDate()).to.eql(dateTimeIn5Minutes.getDate());
    expect(employee2Token!.expiry.getMinutes()).to.eql(dateTimeIn5Minutes.getMinutes());
  });

  it('should return all tokens matching an employeeId and token value', async () => {
    await tokenStore.store(employeeId, value);
    await tokenStore.store(employeeId, value);

    const token2 = Random.string('token2', 16);
    const employee2 = Random.string('employee2', 16);
    await tokenStore.store(employeeId, token2);
    await tokenStore.store(employee2, token2);

    const result = await tokenStore.find(employeeId, value);
    expect(result.length).to.eql(2);
    expect(result[0].value).to.eql(value);
    expect(result[0].employeeId).to.eql(employeeId);
  });
});