import {routes, Routing} from "http4js/core/Routing";
import {Method} from "http4js/core/Methods";
import {NativeHttpServer} from "http4js/servers/NativeHttpServer";
import {ResOf} from "http4js/core/Res";
import {SignUpHandler} from "../src/signup-logIn-logout/SignUpHandler";
import {Authenticator} from "../src/systemAuth/Authenticator";
import {LogInHandler} from "../src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "../src/signup-logIn-logout/LogOutHandler";
import {BalanceHandler} from "../src/transactions/BalanceHandler";
import * as fs from "fs";
require('dotenv').config();

export class Server {
  private server: Routing;

  constructor(authenticator: Authenticator, signUpHandler: SignUpHandler, logInHandler: LogInHandler, logOutHandler: LogOutHandler, balanceHandler: BalanceHandler, private port: number = 3330) {
    this.server = routes(Method.GET, '/health', async() => ResOf(200))
      .withPost('/signup', authenticator.authFilter(signUpHandler))
      .withPost('/login', authenticator.authFilter(logInHandler))
      .withPost('/logout', authenticator.authFilter(logOutHandler))
      .withPut('/balance/{employeeId}', authenticator.authFilter(balanceHandler))

      .withGet('/docs', authenticator.authFilter(async (_req) => ResOf(200, (fs.readFileSync('./docs/output/index.html')).toString())))
      .withGet('/docs/{fileName}', authenticator.authFilter(async (req) => {
        const fileName = req.pathParams.fileName;
        const fileType = req.uri.path().split('.')[1] === 'css' ? 'css' : 'html';
        return ResOf(200, (fs.readFileSync(`./docs/privacy/${fileName}.${fileType}`)).toString())
      }))
      .asServer(new NativeHttpServer(parseInt(process.env.PORT!) || this.port));
  }

  start() {
    try{
      this.server.start();
    } catch (e) {
      console.log("Error on server start:", e)
    }
    console.log(`Server running on port ${this.port}`)
  }

  stop() {
    this.server.stop();
  }
}

