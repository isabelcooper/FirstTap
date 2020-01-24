import {Token, TokenStore} from "./TokenStore";
import {IdGenerator} from "../../utils/IdGenerator";
import {Dates} from "../../utils/Dates";
import {Clock} from "../../utils/Clock";

const TIME_TO_TOKEN_EXPIRY = 5;

export interface TokenManagerClass {
  generateAndStoreToken(employeeId: string): Promise<Token>

  expireTokens(employeeId: string): Promise<Token[]>;

  validateAndUpdateToken(employeeId: string, token: string): Promise<boolean>;

  updateTokenExpiry(employeeId: string, token: string): Promise<Token | undefined>;
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
  }

  public async validateAndUpdateToken(employeeId: string, tokenValue: string): Promise<boolean> {
    const valid = this.tokens.some(storedToken => {
        return storedToken.value === tokenValue
          && storedToken.employeeId === employeeId
          && storedToken.expiry >= new Date()
      }
    );
    if(valid){ await this.updateTokenExpiry(employeeId, tokenValue)}
    return valid
  }

  public async updateTokenExpiry(employeeId: string, tokenValue: string): Promise<Token | undefined> {
    this.tokens.map(token => {
      if( token.employeeId === employeeId && token.value === tokenValue) {
        return token.expiry === Dates.addMinutes(new Date(), 5);
      }
    });
    return this.tokens.find(token => token.employeeId === employeeId && token.value === tokenValue);
  }

}


export class AlwaysFailsTokenManager implements TokenManagerClass {
  async generateAndStoreToken(employeeId: string): Promise<Token> {
    throw Error('Issue with token management')
  }

  expireTokens(employeeId: string): Promise<Token[]> {
    throw Error('Issue with token management')
  }

  validateAndUpdateToken(employeeId: string, token: string): Promise<boolean> {
    throw Error('Issue with token management')
  }

  updateTokenExpiry(employeeId: string, token: string): Promise<Token | undefined> {
    throw Error('Issue with token management')
  }
}

export class TokenManager implements TokenManagerClass {
  constructor(private tokenStore: TokenStore, private idGenerator: IdGenerator, private clock: Clock) {}

  public async generateAndStoreToken(employeeId: string): Promise<Token> {
    const tokenValue = this.idGenerator.createToken();
    const storedToken = await this.tokenStore.store(employeeId, tokenValue, TIME_TO_TOKEN_EXPIRY);
    return {employeeId, value: tokenValue, expiry: storedToken.expiry}
  }

  public async expireTokens(employeeId: string): Promise<Token[]> {
    return await this.tokenStore.expireAll(employeeId);
  }

  public async validateAndUpdateToken(employeeId: string, token: string): Promise<boolean> {
    const matchingTokens = await this.tokenStore.find(employeeId, token);
    console.log("matching tokens in tokenmanager", matchingTokens);
    return matchingTokens.some(matchingToken => {
      return matchingToken.expiry >= new Date(this.clock.now())
    });
  }

  public async updateTokenExpiry(employeeId: string, tokenValue: string): Promise<Token | undefined> {
    return await this.tokenStore.updateTokenExpiry(employeeId, tokenValue, TIME_TO_TOKEN_EXPIRY);
  }
}
