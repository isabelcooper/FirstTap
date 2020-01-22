import {Handler, ResOf} from "http4js";
import {TokenManagerClass} from "../token/TokenManager";
import {EmployeeStore} from "../signup-logIn-logout/EmployeeStore";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";

export class TopUpHandler implements Handler {
  constructor(private tokenManager: TokenManagerClass, private employeeStore: EmployeeStore) {
  }

  public async handle(req: Req): Promise<Res> {
    const employeeId = req.pathParams.employeeId;
    const token = req.header('token');

    const valid = await this.tokenManager.validateToken(employeeId, token);
    if (!valid) {
      return ResOf(401, 'User not logged in')
    }

    const amount = JSON.parse(req.bodyString()).amount;
    let newBalance: number;
    try {
      const updatedEmployee = await this.employeeStore.update(employeeId, amount);
      newBalance = updatedEmployee!.balance
    } catch (e) {
      return ResOf(500, `${e}`)
    }
    return ResOf(200, `Account topped up successfully. New balance is ${newBalance}`)
  }
}
