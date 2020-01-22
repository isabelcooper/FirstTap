import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {EmployeeStore} from "./EmployeeStore";
import {Token} from "../userAuthtoken/TokenStore";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";

export interface Employee {
  name: string,
  email: string,
  employeeId: string,
  mobile: string,
  pin: number,
  balance?: number
}

export class SignUpHandler implements Handler {
  constructor(private employeeStore: EmployeeStore, private tokenManager: TokenManagerClass){}

  async handle(req: Req): Promise<Res> {
    const employee: Employee = JSON.parse(req.bodyString());
    if (!(
      employee.name &&
      employee.employeeId &&
      employee.pin &&
      employee.mobile &&
      employee.email)
    ) {
      return ResOf(400, 'Bad request - missing required employee details')
    }
    //TODO:
    // pass to LoginHandler if already stored?

    try {
      await this.employeeStore.store(employee);
    } catch (e) {
      return ResOf(500, `Error storing new user - please contact your administrator. \n ${e}`)
    }

    let token: Token;
    try {
      token = await this.tokenManager.generateAndStoreToken(employee.employeeId);
    } catch (e) {
      return ResOf(500, `Error retrieving token - please contact your administrator.`)
    }

    return ResOf(200, JSON.stringify({name: employee.name, token: token.value}));
  }
}
