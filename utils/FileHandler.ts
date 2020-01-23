import {Handler, ResOf} from "http4js";
import {TokenManagerClass} from "../src/userAuthtoken/TokenManager";
import {TransactionType} from "../src/signup-logIn-logout/EmployeeStore";
import {Req} from "http4js/core/Req";
import {Res} from "http4js/core/Res";
import {TransactionManagerClass} from "../src/transactions/TransactionManager";
import * as fs from "fs";

export class FileHandler implements Handler {

  public async handle(req: Req): Promise<Res> {
    console.log(req);
    const fileName = req.pathParams.fileName;
    const fileType = req.uri.path().split('.')[1] === 'css' ? 'css' : 'html';
    console.log(`./docs/privacy/${fileName}.${fileType}`);
    return ResOf(200, (fs.readFileSync(`./docs/privacy/${fileName}.${fileType}`)).toString())
  }
}
// TODO move tests over from server
