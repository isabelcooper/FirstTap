import {Employee} from "./SignUpHandler";

export class InMemoryEmployeeStore {
  public employees: Employee[] = [];

  async findAll(): Promise<Employee[]> {
    return this.employees
  }

  async store(employee: Employee) {
    this.employees.push(employee)
  }
}
