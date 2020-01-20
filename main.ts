import {Server} from "./src/server";
import {SignUpHandler} from "./src/SignUpHandler";
import {PostgresMigrator} from "./database/postgres/PostgresMigrator";
import {EVENT_STORE_CONNECTION_DETAILS} from "./config/prod";
import {PostgresDatabase} from "./database/postgres/PostgresDatabase";
import {Pool} from "pg";
import {SqlEmployeeStore} from "./src/EmployeeStore";

(async () => {
  await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

  const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
  let employeeStore = new SqlEmployeeStore(database);

  const server = new Server(new SignUpHandler(employeeStore));
  server.start();
})();
