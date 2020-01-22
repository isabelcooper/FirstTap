import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./systemAuth/Authenticator";
import {LogInHandler} from "./signup-logIn-logout/LogInHandler";
import {InMemoryTokenStore} from "./userAuthtoken/TokenStore";
import {LogOutHandler} from "./signup-logIn-logout/LogOutHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {TokenManager} from "./userAuthtoken/TokenManager";
import {TopUpHandler} from "./topup/TopUpHandler";

(async () => {
  const clock = Date;

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employeeStore = new InMemoryEmployeeStore();
  const tokenStore = new InMemoryTokenStore();
  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator(), clock);

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);
  const topUpHandler = new TopUpHandler(tokenManager, employeeStore);

  const server = new Server(authenticator, signUpHandler, logInHandler, logOutHandler, topUpHandler);
  server.start();
})();
