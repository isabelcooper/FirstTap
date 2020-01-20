import {Server} from "./src/server";
import {SignUpHandler} from "./src/SignUpHandler";
import {InMemoryEmployeeStore} from "./src/EmployeeStore";

(async () => {
  const server = new Server(new SignUpHandler(new InMemoryEmployeeStore()));
  server.start();
})();
