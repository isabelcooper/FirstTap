import {Handler, Req, Res} from "http4js";
import {TokenStore} from "../token/TokenStore";
import {ResOf} from "http4js/core/Res";

export class LogOutHandler implements Handler {
  constructor(private tokenStore: TokenStore) {
  }

  async handle(req: Req): Promise<Res> {
    const reqBody = JSON.parse(req.bodyString());
    const employeeId = reqBody.employeeId as string;

    try{
      await this.tokenStore.update(employeeId);
    } catch (e) {
      return ResOf(500, 'Log out failed - please contact your administrator.')
    }

    return ResOf(200, 'Log out successful - Goodbye!');
  }

}
