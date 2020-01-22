import {InMemoryTokenStore, TokenStore} from "./TokenStore";
import {expect} from "chai";
import {Random} from "../../utils/Random";
import {FixedTokenGenerator} from "../../utils/IdGenerator";
import {TokenManager, TokenManagerClass} from "./TokenManager";
import {FixedClock} from "../../utils/Clock";

describe('TokenManager', () => {
  const employeeId = Random.string('id');
  const fixedTokenValue = Random.string('fixed');
  const tokenGenerator = new FixedTokenGenerator();
  const clock = new FixedClock();
  let tokenStore: TokenStore;
  let tokenManager: TokenManagerClass;

  beforeEach(async () => {
    tokenStore = new InMemoryTokenStore();
    tokenManager = new TokenManager(tokenStore, tokenGenerator, clock);
  });

  it('should generate and store a tokenValue', async () => {
    tokenGenerator.setToken(fixedTokenValue);

    await tokenManager.generateAndStoreToken(employeeId);

    const tokens = await tokenStore.findAll();
    expect(tokens[0].employeeId).to.eql(employeeId);
    expect(tokens[0].value).to.eql(fixedTokenValue);
  });

  it('should expire all tokens for the employeeId', async() => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    tokenGenerator.setToken(fixedTokenValue);
    const employee2 = Random.string('', 16);
    await tokenManager.generateAndStoreToken(employee2);

    await tokenManager.expireTokens(employeeId);
    const tokens = await tokenStore.findAll();

    expect(tokens.length).to.eql(3);
    tokens.map( token => {
      expect(token.value).to.eql(fixedTokenValue);

      if(token.employeeId === employeeId) {
        expect(token.employeeId).to.eql(employeeId);
        expect(token.expiry).to.be.at.most(new Date());
      } else {
        expect(token.employeeId).to.eql(employee2);
        expect(token.expiry).to.be.greaterThan(new Date());
      }
    });
  });

  it('should confirm if there the employeeId and token are valid', async() => {
    const resultForInvalidToken = await tokenManager.validateToken(employeeId, fixedTokenValue);
    expect(resultForInvalidToken).to.eql(false);

    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    const resultForValidToken = await tokenManager.validateToken(employeeId, fixedTokenValue);
    expect(resultForValidToken).to.eql(true);
  });

  it('should reject tokens which have expired', async() => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    clock.moveForwardAnHour();

    const resultForValidToken = await tokenManager.validateToken(employeeId, fixedTokenValue);
    expect(resultForValidToken).to.eql(false);
  });
});
