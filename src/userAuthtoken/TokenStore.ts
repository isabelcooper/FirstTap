import {Dates} from "../../utils/Dates";
import {Clock} from "../../utils/Clock";
import {Random} from "../../utils/Random";

export interface Token {
  employeeId: string,
  value: string,
  expiry: Date
}

export interface TokenStore {
  expireAll(employeeId: string): Promise<Token[]>;

  find(employeeId: string, token: string): Promise<Token[]>;

  findAll(): Promise<Token[]>;

  store(employeeId: string, tokenValue: string, timeToExpiry: number): Promise<Token>;

  updateTokenExpiry(employeeId: string, tokenValue: string, timeToExpiry: number): Promise<Token | undefined>;
}

export class InMemoryTokenStore implements TokenStore {
  constructor(private clock: Clock = Date) {}

  private tokens: Token[] = [];

  public async find(employeeId: string, tokenValue: string): Promise<Token[]> {
    return this.tokens.filter(token => {
      return token.value === tokenValue && token.employeeId === employeeId
    });
  }

  public async findAll(): Promise<Token[]> {
    return this.tokens;
  }

  public async store(employeeId: string, tokenValue: string, timeToExpiry: number): Promise<Token> {
    const now = new Date(this.clock.now());
    const token = {employeeId, value: tokenValue, expiry: Dates.addMinutes(now, timeToExpiry)};
    this.tokens.push(token);
    return token
  }

  public async expireAll(employeeId: string): Promise<Token[]> {
    const now = new Date(this.clock.now());
    this.tokens.map(token => {
      if (token.employeeId === employeeId) {
        token.expiry = now
      }
    });
    return this.tokens.filter(token => token.employeeId === employeeId)!
  }

  public async updateTokenExpiry(employeeId: string, tokenValue: string, tokenExpiryTime: number): Promise<Token | undefined> {
    const now = new Date(this.clock.now());
    this.tokens.map(token => {
      if(token.value === tokenValue && token.employeeId === employeeId) {
        const newExpiry = Dates.addMinutes(now, tokenExpiryTime);
        return token.expiry = newExpiry
      }
    });
      return this.tokens.find(token => token.employeeId === tokenValue && token.employeeId === employeeId);
  }
}

export function buildToken(partial: Partial<Token>): Token {
  return {
    employeeId: Random.string('token', 16),
    expiry: new Date(Dates.addMinutes(new Date(), 5)),
    value: Random.string('tokenValue'),
    ...partial
  };
}
