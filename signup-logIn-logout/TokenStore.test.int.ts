import {Random} from "../utils/Random";
import {expect} from "chai";
import {SqlTokenStore, Token, TokenStore} from "./TokenStore";
import {Dates} from "../utils/Dates";
import {PostgresTestServer} from "../database/postgres/PostgresTestServer";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";

describe('TokenStore', function () {
  this.timeout(30000);
  const testPostgresServer = new PostgresTestServer();
  let database: PostgresDatabase;
  let tokenStore: TokenStore;

  beforeEach(async () => {
    database = await testPostgresServer.startAndGetFirstTapDatabase();
    tokenStore = new SqlTokenStore(database);
  });

  afterEach(async () => {
    await testPostgresServer.stop()
  });

  it('should store tokens with expiry in 5 mins and employeeId', async () => {
    const tokenStore = new SqlTokenStore(database);
    const employeeId = Random.string('', 16);
    const value = Random.string('', 10);
    expect(await tokenStore.store(employeeId, value)).to.eql({inserted: true});
    const dateTimeIn5Minutes = Dates.addMinutes(new Date(), 5);

    const tokens = await tokenStore.findAll();
    expect(tokens[0].employeeId).to.eql(employeeId);
    expect(tokens[0].value).to.eql(value);
    expect(tokens[0].expiry.getDate()).to.eql(dateTimeIn5Minutes.getDate());
    expect(tokens[0].expiry.getMinutes()).to.eql(dateTimeIn5Minutes.getMinutes());

    //TODO: sense check datetime manipulation - could the timezone impact login windows?
  });
});
