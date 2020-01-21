import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";
import {TokenManagerClass} from "../token/TokenManager";

export class LogOutHandler implements Handler {
  constructor(private tokenManager: TokenManagerClass) {
  }

  async handle(req: Req): Promise<Res> {
    const reqBody = JSON.parse(req.bodyString());
    const employeeId = reqBody.employeeId as string;

    try{
      await this.tokenManager.expireTokens(employeeId);
    } catch (e) {
      return ResOf(500, 'Log out failed - please contact your administrator.')
    }

    return ResOf(200, 'Log out successful - Goodbye!');
  }

}
