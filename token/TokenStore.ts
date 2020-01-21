import {PostgresDatabase} from "../database/postgres/PostgresDatabase";
import {Dates} from "../utils/Dates";

export interface Token {
  employeeId: string,
  value: string,
  expiry: Date
}

export interface TokenStore {
  store(employeeId: string, tokenValue: string): Promise<{ inserted: boolean }>;

  findAll(): Promise<Token[]>;

  update(employeeId: string): Promise<{ updated: boolean }>;
}

export class AlwaysFailsTokenStore implements TokenStore {
  findAll(): Promise<Token[]> {
    throw Error('findAll broken')
  }

  store(employeeId: string, tokenValue: string): Promise<{ inserted: boolean }> {
    throw Error('store broken on employee: ' + employeeId)
  }

  update(employeeId: string): Promise<{ updated: boolean }> {
    throw Error('update broken')
  }

  // find(loginDetails: { pin: number; employeeId: string }): Promise<Employee> {
  //   throw Error('employee not found ' + loginDetails)
  // }
}

export class InMemoryTokenStore implements TokenStore {
  private tokens: Token[] = [];

  async findAll(): Promise<Token[]> {
    return this.tokens;
  }

  async store(employeeId: string, tokenValue: string): Promise<{ inserted: boolean }> {
    this.tokens.push({employeeId, value: tokenValue, expiry: Dates.addMinutes(new Date(), 5)});
    return {inserted: true}
  }

  async update(employeeId: string): Promise<{ updated: boolean }> {
    this.tokens.map(token => {
      if (token.employeeId === employeeId) {
        token.expiry = new Date()
      }
    });
    return {updated: true}
  }
}

export class SqlTokenStore implements TokenStore {
  constructor(private database: PostgresDatabase) {
  }

  async store(employeeId: string, tokenValue: string): Promise<{ inserted: boolean }> {
    const sqlStatement = `
      INSERT INTO tokens (employee_id, value) 
      VALUES ('${employeeId}','${tokenValue}') 
      RETURNING *;`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return {inserted: !!rows.length}
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

  async update(employeeId: string): Promise<{ updated: boolean; }> {
    const sqlStatement = `
    UPDATE tokens
    SET expiry = CURRENT_TIMESTAMP
    WHERE employee_id = '${employeeId}'
    RETURNING *;
   `;
    const rows = (await this.database.query(sqlStatement)).rows;
    return {updated: !!rows.length}
  }
}
