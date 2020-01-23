import {InMemoryTokenStore, TokenStore} from "./TokenStore";
import {expect} from "chai";
import {Random} from "../../utils/Random";
import {FixedTokenGenerator} from "../../utils/IdGenerator";
import {TokenManager, TokenManagerClass} from "./TokenManager";
import {FixedClock} from "../../utils/Clock";
import {Dates} from "../../utils/Dates";

describe('TokenManager', () => {
  const employeeId = Random.string('id');
  const fixedTokenValue = Random.string('fixed');
  const tokenGenerator = new FixedTokenGenerator();
  const clock = new FixedClock();
  let tokenStore: TokenStore;
  let tokenManager: TokenManagerClass;

  beforeEach(async () => {
    tokenStore = new InMemoryTokenStore(clock);
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

  it('should confirm if token is valid and update the expiry if so', async() => {
    const resultForInvalidToken = await tokenManager.validateAndUpdateToken(employeeId, fixedTokenValue);
    expect(resultForInvalidToken).to.eql(false);

    clock.moveForwardMins(5);

    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    const resultForValidToken = await tokenManager.validateAndUpdateToken(employeeId, fixedTokenValue);
    expect(resultForValidToken).to.eql(true);

    clock.moveForwardMins(5);
    expect((await tokenStore.findAll())[0].expiry.getMinutes()).to.be.eql(new Date(clock.now()).getMinutes());
  });

  it('should reject tokens which have expired', async() => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    clock.moveForwardMins(6);

    const resultForValidToken = await tokenManager.validateAndUpdateToken(employeeId, fixedTokenValue);
    expect(resultForValidToken).to.eql(false);

    clock.moveForwardMins(5);
    expect((await tokenStore.findAll())[0].expiry).to.be.lessThan(new Date(clock.now()));
  });

  it('should update expiry times', async () => {
    tokenGenerator.setToken(fixedTokenValue);
    await tokenManager.generateAndStoreToken(employeeId);

    clock.moveForwardMins(4);
    await tokenManager.updateTokenExpiry(employeeId, fixedTokenValue);

    clock.moveForwardMins(3);

    const resultForValidToken = await tokenManager.validateAndUpdateToken(employeeId, fixedTokenValue);
    expect(resultForValidToken).to.eql(true);
  });
});
