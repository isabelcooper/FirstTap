import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./utils/Authenticator";
import {LogInHandler} from "./signup-logIn-logout/LogInHandler";
import {InMemoryTokenStore} from "./token/TokenStore";
import {LogOutHandler} from "./signup-logIn-logout/LogOutHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {TokenManager} from "./token/TokenManager";

(async () => {
  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employeeStore = new InMemoryEmployeeStore();
  const tokenStore = new InMemoryTokenStore();
  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator());

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);

  const server = new Server(signUpHandler, logInHandler, logOutHandler, authenticator);
  server.start();
})();
