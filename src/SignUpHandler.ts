import {Handler, Req, Res} from "http4js";
import {ResOf} from "http4js/core/Res";

export interface Employee {
  name: string,
  email: string,
  employeeId: string,
  mobile: string,
  pin: number
}

export class SignUpHandler implements Handler {
  async handle(req: Req): Promise<Res> {
    const body: Employee = JSON.parse(req.bodyString());

    if(!body.name || !body.employeeId || !body.pin || !body.name || !body.mobile || !body.email) {
      return ResOf(400, 'Bad request - missing required employee details')
    }

    // check if in DB - redirect if not
    // create user -- should return ok

    return ResOf(200, JSON.stringify({name: body.name}));
  }
}
