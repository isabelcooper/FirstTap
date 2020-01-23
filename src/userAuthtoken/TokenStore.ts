import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Dates} from "../../utils/Dates";
import {Clock} from "../../utils/Clock";

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

  updateTokenExpiry(employeeId: string, tokenValue: string, timeToExpiry: number): Promise<Token | null>;
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

  public async updateTokenExpiry(employeeId: string, tokenValue: string, tokenExpiryTime: number): Promise<Token | null> {
    const now = new Date(this.clock.now());
    this.tokens.map(token => {
      if(token.value === tokenValue && token.employeeId === employeeId) {
        const newExpiry = Dates.addMinutes(now, tokenExpiryTime);
        return token.expiry = newExpiry
      }
    });
      return this.tokens.find(token => token.employeeId === tokenValue && token.employeeId === employeeId) || null;
  }
}

export class SqlTokenStore implements TokenStore {
  constructor(private database: PostgresDatabase) {
  }

  async store(employeeId: string, tokenValue: string, timeToExpiry: number): Promise<Token> {
    const sqlStatement = `
      INSERT INTO tokens (employee_id, value, expiry) 
      VALUES ('${employeeId}','${tokenValue}', CURRENT_TIMESTAMP + INTERVAL '${timeToExpiry} minute') 
      RETURNING *;`;
    const insertedRow = (await this.database.query(sqlStatement)).rows[0];
    return {
      employeeId: insertedRow.employee_id,
      value: insertedRow.value,
      expiry: new Date(insertedRow.expiry)
    }
  }

  async findAll(): Promise<Token[]> {
    const sqlStatement = `SELECT * FROM tokens`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        employeeId: row.employee_id,
        value: row.value,
        expiry: new Date(row.expiry)
      }
    })
  }

  async expireAll(employeeId: string): Promise<Token[]> {
    const sqlStatement = `
    UPDATE tokens
    SET expiry = CURRENT_TIMESTAMP
    WHERE employee_id = '${employeeId}'
    RETURNING *;
   `;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        employeeId: row.employee_id,
        expiry: row.expiry,
        value: row.value
      }
    })
  }

  public async find(employeeId: string, tokenValue: string): Promise<Token[]> {
    const sqlStatement = `
    SELECT * FROM tokens 
    WHERE employee_id = '${employeeId}'
    AND value = '${tokenValue}';
    `;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        employeeId: row.employee_id,
        value: row.value,
        expiry: new Date(row.expiry)
      }
    })
  }

  public async updateTokenExpiry(employeeId: string, tokenValue: string, tokenExpiryTime: number): Promise<Token | null> {
    const sqlStatement = `
    UPDATE tokens
    SET expiry = CURRENT_TIMESTAMP + INTERVAL '${tokenExpiryTime} minute'
    WHERE employee_id = '${employeeId}'
    RETURNING *;
   `;
    const row = (await this.database.query(sqlStatement)).rows[0];
    return {
        employeeId: row.employee_id,
        expiry: row.expiry,
        value: row.value
      }
  }
}
