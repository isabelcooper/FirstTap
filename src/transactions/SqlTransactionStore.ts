import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Transaction, TransactionStore} from "./TransactionStore";

export class SqlTransactionStore implements TransactionStore {
  constructor(private database: PostgresDatabase) {
  }

  public async store(transaction: Transaction): Promise<Transaction | undefined> {
    const sqlStatement = `
      INSERT INTO transactions (employee_id, category, item_ref, kiosk_ref, amount) 
      VALUES ('${transaction.employeeId}','${transaction.category}', '${transaction.itemRef}','${transaction.kioskRef}', '${transaction.amount}') 
      RETURNING *;`;
    const insertedRow = (await this.database.query(sqlStatement)).rows[0];
    return {
      employeeId: insertedRow.employee_id,
      amount: insertedRow.amount,
      category: insertedRow.category,
      itemRef: insertedRow.item_ref,
      kioskRef: insertedRow.kiosk_ref,
      transactionTime: insertedRow.transaction_time
    }
  }

  public async findAllByEmployeeId(employeeId: string): Promise<Transaction[]> {
    const sqlStatement = `SELECT * FROM transactions WHERE employee_id = '${employeeId}'`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        employeeId: row.employee_id,
        amount: row.amount,
        category: row.category,
        itemRef: row.item_ref,
        kioskRef: row.kiosk_ref,
        transactionTime: row.transaction_time
      }
    })
  }
}
