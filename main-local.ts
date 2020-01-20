import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./signup-logIn-logout/EmployeeStore";

(async () => {
  const server = new Server(new SignUpHandler(new InMemoryEmployeeStore()));
  server.start();
})();
