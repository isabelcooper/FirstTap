import {Handler, ResOf} from "http4js";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";
import {TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";
import {TransactionManagerClass} from "./TransactionManager";
import {Method} from "http4js/core/Methods";

export class BalanceHandler implements Handler {
  constructor(private tokenManager: TokenManagerClass, private transactionManager: TransactionManagerClass) {
  }

  public async handle(req: Req): Promise<Res> {
    const employeeId = req.pathParams.employeeId;
    const token = req.header('token');

    const valid = await this.tokenManager.validateAndUpdateToken(employeeId, token);
    if (!valid) {
      return ResOf(401, 'User not logged in')
    }

    if(req.method === Method.GET) {
      return ResOf(200, `Current balance: ${await this.transactionManager.retrieveBalance(employeeId)}`)
    }

    const reqBody = JSON.parse(req.bodyString());
    const transactionType: TransactionType = reqBody.transactionType;
    const amount = reqBody.amount;

    let newBalance: number;
    try {
      const updatedEmployee = await this.transactionManager.updateBalance(employeeId, amount, transactionType);
      newBalance = updatedEmployee!.balance || 0 // TODO add test?
    } catch (e) {
      return ResOf(500, `${e}`)
    }
    return ResOf(200, `New balance is ${(newBalance).toFixed(2)}`)
  }
}
