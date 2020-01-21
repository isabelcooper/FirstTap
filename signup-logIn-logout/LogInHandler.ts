import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {EmployeeStore} from "./EmployeeStore";
import {Employee} from "./SignUpHandler";
import {Token} from "../token/TokenStore";
import {TokenManagerClass} from "../token/TokenManager";

export class LogInHandler implements Handler {
  constructor(private employeeStore: EmployeeStore, private tokenManager: TokenManagerClass){}

  async handle(req: Req): Promise<Res> {
    const reqBody: Employee = JSON.parse(req.bodyString());
    if (!(
      reqBody.employeeId &&
      reqBody.pin)
    ) {
      return ResOf(400, 'Bad request - missing required employee details')
    }

    let matchedEmployee: Employee | null;
    try {
      matchedEmployee = await this.employeeStore.find({employeeId: reqBody.employeeId, pin: reqBody.pin});
      if(!matchedEmployee) {
        return ResOf(401, 'User not recognised')
      }
    } catch (e) {
      return ResOf(500, `Error storing new user - please contact your administrator. \n ${e}`)
    }

    let token: Token;
    try {
      token = await this.tokenManager.generateAndStoreToken(matchedEmployee.employeeId);
    } catch (e) {
      return ResOf(500, `Error retrieving token - please contact your administrator.`)
    }

    return ResOf(200, JSON.stringify({name: matchedEmployee.name, token: token.value}));
  }
}
