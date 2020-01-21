import {Server} from "./server/server";
import {SignUpHandler} from "./signup-logIn-logout/SignUpHandler";
import {PostgresMigrator} from "./database/postgres/PostgresMigrator";
import {EVENT_STORE_CONNECTION_DETAILS} from "./config/prod";
import {PostgresDatabase} from "./database/postgres/PostgresDatabase";
import {Pool} from "pg";
import {SqlEmployeeStore} from "./signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./utils/Authenticator";
import {LogInHandler} from "./signup-logIn-logout/LogInHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {SqlTokenStore} from "./signup-logIn-logout/TokenStore";

(async () => {
  await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

  const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
  const employeeStore = new SqlEmployeeStore(database);
  const tokenStore = new SqlTokenStore(database);

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const server = new Server(new SignUpHandler(employeeStore), new LogInHandler(employeeStore, tokenStore, new UniqueUserIdGenerator()), authenticator);
  server.start();
})();
