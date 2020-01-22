import {Handler, ResOf} from "http4js";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";
import {EmployeeStore, TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";

export class BalanceHandler implements Handler {
  constructor(private tokenManager: TokenManagerClass, private employeeStore: EmployeeStore) {
  }

  public async handle(req: Req): Promise<Res> {
    const employeeId = req.pathParams.employeeId;
    const token = req.header('token');

    const valid = await this.tokenManager.validateToken(employeeId, token);
    if (!valid) {
      return ResOf(401, 'User not logged in')
    }

    const reqBody = JSON.parse(req.bodyString());
    const transactionType: TransactionType = reqBody.transactionType;
    const amount = reqBody.amount;

    let newBalance: number;
    try {
      const updatedEmployee = await this.employeeStore.update(employeeId, amount, transactionType);
      newBalance = updatedEmployee!.balance || 0 // TODO add test?
    } catch (e) {
      return ResOf(500, `${e}`)
    }
    return ResOf(200, `New balance is ${newBalance}`)
  }
}
