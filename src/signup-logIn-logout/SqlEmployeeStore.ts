import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";
import {Employee} from "./SignUpHandler";
import {Action, EmployeeStore} from "./EmployeeStore";

export class SqlEmployeeStore implements EmployeeStore {
  constructor(private database: PostgresDatabase) {
  }

  async login(pin: number, employeeId: string): Promise<Employee | undefined> {
    const sqlStatement = `
      SELECT * FROM employees 
      WHERE employee_id = '${employeeId}' 
      AND pin = ${pin}      
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      mobile: row.mobile,
      pin: parseInt(row.pin),
      balance: parseFloat(row.balance)
    }
  };

  async findAll(): Promise<Employee[]> {
    let sqlStatement = `SELECT * FROM employees`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        name: row.name,
        email: row.email,
        employeeId: row.employee_id,
        mobile: row.mobile,
        pin: parseInt(row.pin),
        balance: parseFloat(row.balance)
      }
    })
  }

  async store(employee: Employee): Promise<Employee | undefined> {
    const sqlStatement = `
      INSERT INTO employees (name, email, employee_id, mobile, pin) 
      VALUES ('${employee.name}','${employee.email}','${employee.employeeId}','${employee.mobile}',${employee.pin}) 
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      mobile: row.mobile,
      pin: parseInt(row.pin),
      balance: parseFloat(row.balance)
    }
  }

  public async update(employeeId: string, amount: number, action: Action): Promise<Employee | undefined> {
    const sqlStatement = `
      UPDATE employees 
      SET balance = balance ${action} ${amount}
      WHERE employee_id = '${employeeId}'  
      RETURNING *;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      employeeId: row.employee_id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      pin: parseInt(row.pin),
      balance: parseFloat(row.balance)
    }
  }

  public async checkBalance(employeeId: string): Promise<any> {
    const sqlStatement = `
      SELECT balance FROM employees 
      WHERE employee_id = '${employeeId}' 
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    return parseFloat(row.balance)
  }

  public async find(employeeId: string): Promise<Employee | undefined> {
    const sqlStatement = `
      SELECT * FROM employees 
      WHERE employee_id = '${employeeId}' 
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return;
    return {
      employeeId: row.employee_id,
      name: row.name,
      email: row.email,
      mobile: row.mobile,
      pin: parseInt(row.pin),
      balance: parseFloat(row.balance)
    }
  }
}
