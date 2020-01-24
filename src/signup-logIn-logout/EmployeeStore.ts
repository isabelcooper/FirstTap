import {Random} from "../../utils/Random";

export enum Action {
  Plus = '+',
  Minus = '-',
}

export enum TransactionType {
  PURCHASE = 'purchase',
  TOPUP = 'topup',
}

export interface Employee {
  firstName: string,
  lastName?: string,
  email: string,
  employeeId: string,
  mobile: string,
  pin: number,
  balance?: number
}

export function buildEmployee(partial?: Partial<Employee>) {
  return {
    firstName: Random.string('firstName'),
    lastName: Random.string('lastName'),
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

  login(pin: number, employeeId: string): Promise<Employee | undefined>;

  findAll(): Promise<Employee[]>;

  store(employee: Employee): Promise<Employee | undefined>;

  update(employeeId: string, amount: number, action: Action): Promise<Employee | undefined>;

  find(employeeId: string): Promise<Employee | undefined>;
}

export class InMemoryEmployeeStore implements EmployeeStore {
  public employees: Employee[] = [];

  public async login(pin: number, employeeId: string): Promise<Employee | undefined> {
    return (this.employees.find(employee => {
      return employee.employeeId === employeeId && employee.pin === pin
    }))
  }

  public async findAll(): Promise<Employee[]> {
    return this.employees
  }

  public async store(employee: Employee): Promise<Employee> {
    this.employees.push(employee);
    return employee
  }

  public async update(employeeId: string, amount: number, action: Action): Promise<Employee | undefined> {
    const updateThisEmployee = await this.find(employeeId);

    if (!updateThisEmployee) return;
    if (updateThisEmployee.balance === undefined) updateThisEmployee.balance = amount;
    else if (action === Action.Plus) updateThisEmployee.balance += amount;
    else if (action === Action.Minus) updateThisEmployee.balance -= amount;
    return updateThisEmployee
    //TODO simplify or split out? also not updating array!
  }

  public async checkBalance(employeeId: string): Promise<number> {
    const matchedEmployee = await this.find(employeeId);
    return matchedEmployee && matchedEmployee.balance || 0
  }

  public async find(employeeId: string): Promise<Employee | undefined> {
    return this.employees.find(employee => employeeId === employee.employeeId)
  }
}

export class AlwaysFailsEmployeeStore implements EmployeeStore {
  findAll(): Promise<Employee[]> {
    throw Error('store broken');
  }

  store(employee: Employee): Promise<Employee> {
    throw Error('store broken on employee: ' + employee)
  }

  login(pin: number, employeeId: string): Promise<Employee | undefined> {
    throw Error('employee not found ' + employeeId)
  }

  update(employeeId: string, amount: number, action: Action): Promise<Employee | undefined> {
    throw Error('employee not found ' + employeeId)
  }

  checkBalance(employeeId: string): Promise<number> {
    throw Error('employee not found ' + employeeId)
  }

  public async find(employeeId: string): Promise<Employee | undefined> {
    return undefined;
  }
}
