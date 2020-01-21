import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {EmployeeStore} from "./EmployeeStore";
import {Employee} from "./SignUpHandler";
import {IdGenerator} from "../utils/IdGenerator";
import {TokenStore} from "../token/TokenStore";

export class LogInHandler implements Handler {
  constructor(private employeeStore: EmployeeStore, private tokenStore: TokenStore, private tokenGenerator: IdGenerator){}

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

    let token: string | null;
    try {
      token = this.tokenGenerator.createToken();
      await this.tokenStore.store(matchedEmployee.employeeId, token);
    } catch (e) {
      return ResOf(500, `Error retrieving token - please contact your administrator.`)
    } //TODO no test for error

    return ResOf(200, JSON.stringify({name: matchedEmployee.name, token}));
  }
}
