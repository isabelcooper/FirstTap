import {Employee} from "./SignUpHandler";
import {Random} from "../../utils/Random";
import {PostgresDatabase} from "../../database/postgres/PostgresDatabase";

export enum Action {
  Plus = '+',
  Minus = '-',
}

export enum TransactionType {
  PURCHASE = 'purchase',
  TOPUP = 'topup',
}

export function buildEmployee(partial?: Partial<Employee>) {
  return {
    name: Random.string('name'),
    email: Random.string('email'),
    employeeId: Random.string('employeeId', 16),
    mobile: Random.string('mobile'),
    pin: Random.integer(9999),
    balance: Random.integer(10000000) / 100,
    ...partial
  };
}

export interface EmployeeStore {
  checkBalance(employeeId: string): Promise<number>;

  find(loginDetails: { pin: number; employeeId: string }): Promise<Employee | null>;

  findAll(): Promise<Employee[]>;

  store(employee: Employee): Promise<Employee | null>;

  update(employeeId: string, amount: number, action: Action): Promise<Employee | null>;
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

  public async store(employee: Employee): Promise<Employee> {
    this.employees.push(employee);
    return employee
  }

  public async update(employeeId: string, amount: number, action: Action): Promise<Employee | null> {
    const updateThisEmployee = this.employees.find(employee => employeeId === employee.employeeId);

    if (!updateThisEmployee) return null;
    if (updateThisEmployee.balance === undefined) updateThisEmployee.balance = amount;
    else if (action === Action.Plus) updateThisEmployee.balance += amount;
    else if (action === Action.Minus) updateThisEmployee.balance -= amount;
    return updateThisEmployee
    //TODO simplify or split out? also not updating array!
  }

  public async checkBalance(employeeId: string): Promise<number> {
    const matchedEmployee = this.employees.find(employee => employeeId === employee.employeeId);
    return matchedEmployee && matchedEmployee.balance || 0
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

  async store(employee: Employee): Promise<Employee | null> {
    const sqlStatement = `
      INSERT INTO employees (name, email, employee_id, mobile, pin) 
      VALUES ('${employee.name}','${employee.email}','${employee.employeeId}','${employee.mobile}',${employee.pin}) 
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    return row ? {
      name: row.name,
      email: row.email,
      employeeId: row.employee_id,
      mobile: row.mobile,
      pin: parseInt(row.pin),
      balance: parseFloat(row.balance)
    } : null
  }

  public async update(employeeId: string, amount: number, action: Action): Promise<Employee | null> {
    const sqlStatement = `
      UPDATE employees 
      SET balance = balance ${action} ${amount}
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

  public async checkBalance(employeeId: string): Promise<any> {
    const sqlStatement = `
      SELECT balance FROM employees 
      WHERE employee_id = '${employeeId}' 
      ;`;
    const row = (await this.database.query(sqlStatement)).rows[0];
    return parseFloat(row.balance)
  }
}

export class AlwaysFailsEmployeeStore implements EmployeeStore {
  findAll(): Promise<Employee[]> {
    throw Error('findAll broken')
  }

  store(employee: Employee): Promise<Employee> {
    throw Error('store broken on employee: ' + employee)
  }

  find(loginDetails: { pin: number; employeeId: string }): Promise<Employee> {
    throw Error('employee not found ' + loginDetails)
  }

  update(employeeId: string, amount: number, action: Action): Promise<Employee | null> {
    throw Error('employee not found ' + employeeId)
  }

  checkBalance(employeeId: string): Promise<number> {
    throw Error('employee not found ' + employeeId)
  }
}
