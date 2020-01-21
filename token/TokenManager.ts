import {Token, TokenStore} from "./TokenStore";
import {IdGenerator} from "../utils/IdGenerator";
import {Dates} from "../utils/Dates";

export interface TokenManagerClass {
  generateAndStoreToken(employeeId: string): Promise<Token>

  expireTokens(employeeId: string): Promise<Token[]>;
}

export class InMemoryTokenManager implements TokenManagerClass {
  public availableTokenValue: string = '';
  public tokens: Token[] = [];

  async generateAndStoreToken(employeeId: string): Promise<Token> {
    const token = {employeeId, expiry: Dates.addMinutes(new Date(), 5) , value: this.availableTokenValue};
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

}


export class AlwaysFailsTokenManager implements TokenManagerClass {
  async generateAndStoreToken(employeeId: string): Promise<Token> {
    throw Error('Issue with token management')
  }

  expireTokens(employeeId: string): Promise<Token[]> {
    throw Error('Issue with token management')
  }
}

export class TokenManager implements TokenManagerClass {
  constructor(private tokenStore: TokenStore, private idGenerator: IdGenerator) {
  }

  public async generateAndStoreToken(employeeId: string): Promise<Token> {
    const tokenValue = this.idGenerator.createToken();
    await this.tokenStore.store(employeeId, tokenValue);
    return {employeeId, value: tokenValue, expiry: new Date()}

    //TODO return the real date from token store
  }

  public async expireTokens(employeeId: string): Promise<Token[]> {
    return await this.tokenStore.expireAll(employeeId);
  }
}
