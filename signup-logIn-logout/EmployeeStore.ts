import {Employee} from "./SignUpHandler";
import {Random} from "../utils/Random";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";

export function buildEmployee(partial?: Partial<Employee>) {
  return {
    name: Random.string('name'),
    email: Random.string('email'),
    employeeId: Random.string('employeeId', 16),
    mobile: Random.string('mobile'),
    pin: Random.integer(9999),
    balance: Random.integer(10000000)/100,
    ...partial
  };
}

export interface EmployeeStore {
  find(loginDetails: { pin: number; employeeId: string }): Promise<Employee | null>;

  findAll(): Promise<Employee[]>;

  store(employee: Employee): Promise<{ inserted: boolean }>;

  update(employeeId: string, amount: number): Promise<Employee | null>;
}

export class InMemoryEmployeeStore implements EmployeeStore {
  public employees: Employee[] = [];

  public async find(loginDetails: { pin: number; employeeId: string; }): Promise<Employee | null> {
    return (this.employees.find(employee => {
      return employee.employeeId === loginDetails.employeeId && employee.pin === loginDetails.pin
    })) || null
  }

  public async findAll(): Promise<Employee[]> {
    return this.employees
  }

  public async store(employee: Employee): Promise<{ inserted: boolean }> {
    this.employees.push(employee);
    return {inserted: true}
  }

  public async update(employeeId: string, amount: number): Promise<Employee | null> {
    this.employees.map(employee => {
        if (employee.employeeId === employeeId) employee.balance += amount
      }
    );
    return this.employees.find(employee => employee.employeeId === employeeId) || null
  }
}

export class SqlEmployeeStore implements EmployeeStore {
  constructor(private database: PostgresDatabase) {
  }

  async find(loginDetails: { pin: number; employeeId: string }): Promise<Employee | null> {
    const sqlStatement = `
      SELECT * FROM employees 
      WHERE employee_id = '${loginDetails.employeeId}' 
      AND pin = ${loginDetails.pin}      
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
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

  async store(employee: Employee): Promise<{ inserted: boolean }> {
    const sqlStatement = `
      INSERT INTO employees (name, email, employee_id, mobile, pin, balance) 
      VALUES ('${employee.name}','${employee.email}','${employee.employeeId}','${employee.mobile}',${employee.pin}, ${employee.balance}) 
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return {inserted: !!rows.length}
  }

  public async update(employeeId: string, amount: number): Promise<Employee | null> {
    const sqlStatement = `
      UPDATE employees 
      SET balance = balance + ${amount}
      WHERE employee_id = '${employeeId}'  
      RETURNING *;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    if (!row) return null;
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
