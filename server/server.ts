import {routes, Routing} from "http4js/core/Routing";
import {Method} from "http4js/core/Methods";
import {NativeHttpServer} from "http4js/servers/NativeHttpServer";
import {ResOf} from "http4js/core/Res";
import {SignUpHandler} from "../signup-logIn-logout/SignUpHandler";
import {Authenticator} from "../utils/Authenticator";
import {LogInHandler} from "../signup-logIn-logout/LogInHandler";
require('dotenv').config();

export class Server {
  private server: Routing;

  constructor(signUpHandler: SignUpHandler, logInHandler: LogInHandler, authenticator: Authenticator, private port: number = 3330) {
    this.server = routes(Method.GET, '/health', async() => ResOf(200))
      .withPost('/signup', authenticator.authFilter(signUpHandler))
      .withPost('/login', authenticator.authFilter(logInHandler))
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

