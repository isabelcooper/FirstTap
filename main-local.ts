import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./utils/Authenticator";
import {LogInHandler} from "./signup-logIn-logout/LogInHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {InMemoryTokenStore} from "./token/TokenStore";
import {LogOutHandler} from "./signup-logIn-logout/LogOutHandler";
require('dotenv').config();

(async () => {
  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employeeStore = new InMemoryEmployeeStore();
  const tokenStore = new InMemoryTokenStore();

  const signUpHandler = new SignUpHandler(employeeStore);
  const logInHandler = new LogInHandler(employeeStore, tokenStore, new UniqueUserIdGenerator());
  const logOutHandler = new LogOutHandler(tokenStore);

  const server = new Server(signUpHandler, logInHandler, logOutHandler, authenticator);
  server.start();
})();
