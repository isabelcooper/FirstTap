import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Token, TokenStore} from "./TokenStore";

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
    console.log('searching store for', employeeId, tokenValue)
    const sqlStatement = `
    SELECT * FROM tokens 
    WHERE employee_id = '${employeeId}'
    AND value = '${tokenValue}';
    `;
    const rows = (await this.database.query(sqlStatement)).rows;
    console.log("rows matching in store", rows);
    return rows.map(row => {
      return {
        employeeId: row.employee_id,
        value: row.value,
        expiry: new Date(row.expiry)
      }
    })
  }

  public async updateTokenExpiry(employeeId: string, tokenValue: string, tokenExpiryTime: number): Promise<Token | undefined> {
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
