import {Token, TokenStore} from "./TokenStore";
import {IdGenerator} from "../../utils/IdGenerator";
import {Dates} from "../../utils/Dates";
import {Clock} from "../../utils/Clock";

export interface TokenManagerClass {
  generateAndStoreToken(employeeId: string): Promise<Token>

  expireTokens(employeeId: string): Promise<Token[]>;

  validateToken(employeeId: string, token: string): Promise<boolean>;
}

export class InMemoryTokenManager implements TokenManagerClass {
  public availableTokenValue: string = '';
  public tokens: Token[] = [];

  async generateAndStoreToken(employeeId: string): Promise<Token> {
    const token = {employeeId, expiry: Dates.addMinutes(new Date(), 5), value: this.availableTokenValue};
    this.tokens.push(token);
    return token
  }

  public setToken(token: string): void {
    this.availableTokenValue = token;
  }

  public async expireTokens(employeeId: string): Promise<Token[]> {
    this.tokens.map(token => {
      if (token.employeeId === employeeId) {
        token.expiry = new Date()
      }
    });
    return this.tokens.filter(token => token.employeeId === employeeId);
    //TODO must be a neater way?
  }

  public async validateToken(employeeId: string, token: string): Promise<boolean> {
    return this.tokens.some(storedToken => {
        return storedToken.value === token
          && storedToken.employeeId === employeeId
          && storedToken.expiry >= new Date()
      }
    );
  }

}


export class AlwaysFailsTokenManager implements TokenManagerClass {
  async generateAndStoreToken(employeeId: string): Promise<Token> {
    throw Error('Issue with token management')
  }

  expireTokens(employeeId: string): Promise<Token[]> {
    throw Error('Issue with token management')
  }

  validateToken(employeeId: string, token: string): Promise<boolean> {
    throw Error('Issue with token management')
  }
}

export class TokenManager implements TokenManagerClass {
  constructor(private tokenStore: TokenStore, private idGenerator: IdGenerator, private clock: Clock) {}

  public async generateAndStoreToken(employeeId: string): Promise<Token> {
    const tokenValue = this.idGenerator.createToken();
    const storedToken = await this.tokenStore.store(employeeId, tokenValue);
    return {employeeId, value: tokenValue, expiry: storedToken.expiry}
  }

  public async expireTokens(employeeId: string): Promise<Token[]> {
    return await this.tokenStore.expireAll(employeeId);
  }

  public async validateToken(employeeId: string, token: string): Promise<boolean> {
    const matchingTokens = await this.tokenStore.find(employeeId, token);
    return matchingTokens.some(matchingToken => {
      return matchingToken.expiry >= new Date(this.clock.now())
    });
  }
}
