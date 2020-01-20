import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./utils/Authenticator";

(async () => {
  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const server = new Server(new SignUpHandler(new InMemoryEmployeeStore()), authenticator);
  server.start();
})();
