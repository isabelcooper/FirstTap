import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./utils/Authenticator";
import {LogInHandler} from "./signup-logIn-logout/LogInHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {InMemoryTokenStore, SqlTokenStore} from "./signup-logIn-logout/TokenStore";

(async () => {
  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employeeStore = new InMemoryEmployeeStore();

  const server = new Server(new SignUpHandler(employeeStore), new LogInHandler(employeeStore, new InMemoryTokenStore(), new UniqueUserIdGenerator()), authenticator);
  server.start();
})();
