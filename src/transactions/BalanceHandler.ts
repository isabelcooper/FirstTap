import {Handler, ResOf} from "http4js";
import {TokenManagerClass} from "../userAuthtoken/TokenManager";
import {TransactionType} from "../signup-logIn-logout/EmployeeStore";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";
import {TransactionManagerClass} from "./TransactionManager";
import {Method} from "http4js/core/Methods";
import {Transaction} from "./TransactionStore";

export class BalanceHandler implements Handler {
  constructor(private tokenManager: TokenManagerClass, private transactionManager: TransactionManagerClass) {
  }

  public async handle(req: Req): Promise<Res> {
    const employeeId = req.pathParams.employeeId;
    const token = req.header('token');

    const valid = token && await this.tokenManager.validateAndUpdateToken(employeeId, token);
    if (!valid) {
      return ResOf(401, 'User not logged in')
    }

    let balance: number = 0;
    try {
      switch (req.method) {
        case Method.GET:
          balance = await this.transactionManager.retrieveBalance(employeeId);
          break;
        case Method.PUT:
          const reqBody = JSON.parse(req.bodyString());
          const transactionType: TransactionType = reqBody.transactionType;
          const amount = reqBody.amount;
          const transactionDetails = reqBody.transactionDetails || undefined;
          let transaction: Transaction | undefined = undefined;
          if (transactionDetails) {
            transaction = {
              ...transactionDetails,
              amount,
              employeeId: employeeId
            }
          }
          const updatedEmployee = await this.transactionManager.updateBalance(employeeId, amount, transactionType, transaction);
          balance = updatedEmployee!.balance;
          break;
      }
    } catch (e) {
      return ResOf(500, `${e}`)
    }

    return ResOf(200, `Your balance: ${balance.toFixed(2)}`);
  }
}
