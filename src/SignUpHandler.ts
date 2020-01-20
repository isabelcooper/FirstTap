import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {EmployeeStore} from "./EmployeeStore";

export interface Employee {
  name: string,
  email: string,
  employeeId: string,
  mobile: string,
  pin: number
}

export class SignUpHandler implements Handler {
  constructor(private employeeStore: EmployeeStore){}

  async handle(req: Req): Promise<Res> {
    const employee: Employee = JSON.parse(req.bodyString());

    if(!employee.name || !employee.employeeId || !employee.pin || !employee.name || !employee.mobile || !employee.email) {
      return ResOf(400, 'Bad request - missing required employee details')
    }

    // check if in DB - redirect if not
    // employeeStore.find(employee.employeeId);
    // create user -- should return ok

    await this.employeeStore.store(employee);
    //TODO: err testing
    return ResOf(200, JSON.stringify({name: employee.name}));
  }
}
