import {PostgresDatabase} from "../database/postgres/PostgresDatabase";

export interface Token {
  employeeId: string,
  value: string,
  expiry: Date
}

export interface TokenStore {
  store(employeeId: string, tokenValue: string): Promise<{inserted: boolean}>;

  findAll(): Promise<Token[]>;
}

export class SqlTokenStore {
  constructor(private database: PostgresDatabase) {}

  async store(employeeId: string, tokenValue: string): Promise<{inserted: boolean}> {
    const sqlStatement = `
      INSERT INTO tokens (employee_id, value) 
      VALUES ('${employeeId}','${tokenValue}') 
      RETURNING *;`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return {inserted: !!rows.length}
  }

  async findAll(): Promise<Token[]> {
    let sqlStatement = `SELECT * FROM tokens`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        employeeId: row.employee_id,
        value: row.value,
        expiry: new Date(row.expiry)
      }
    })
  }
}
