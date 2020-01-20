import {Employee} from "./SignUpHandler";
import {Random} from "../utils/Random";
import {PostgresDatabase} from "../database/postgres/PostgresDatabase";

export function buildEmployee(partial: Partial<Employee>) {
  return {
    name: Random.string('name'),
    email: Random.string('email'),
    employeeId: Random.string('employeeId', 16),
    mobile: Random.string('mobile'),
    pin: Random.integer(9999),
    ...partial
  };
}

export interface EmployeeStore {
  findAll(): Promise<Employee[]>;

  store(employee: Employee): Promise<{inserted: boolean}>;
}

export class InMemoryEmployeeStore implements EmployeeStore {
  public employees: Employee[] = [];

  async findAll(): Promise<Employee[]> {
    return this.employees
  }

  async store(employee: Employee): Promise<{inserted: boolean}> {
    this.employees.push(employee);
    return {inserted: true}
  }
}

export class SqlEmployeeStore implements EmployeeStore {
  constructor(private database: PostgresDatabase) {
  }

  async findAll(): Promise<Employee[]> {
    let sqlStatement = `SELECT * FROM employees`;
    const rows = (await this.database.query(sqlStatement)).rows;
    return rows.map(row => {
      return {
        name: row.name,
        email: row.email,
        employeeId: row.employee_id,
        mobile: row.mobile,
        pin: parseInt(row.pin)
      }
    })
  }

  async store(employee: Employee): Promise<{inserted: boolean}> {
    let sqlStatement = `
      INSERT INTO employees (name, email, employee_id, mobile, pin) 
      VALUES ('${employee.name}','${employee.email}','${employee.employeeId}','${employee.mobile}',${employee.pin}) 
      ON CONFLICT DO NOTHING
      RETURNING *;`;
    let queryResult = await this.database.query(sqlStatement);
    const rows = (queryResult).rows;
    return {inserted: !!rows.length}
  }
}
