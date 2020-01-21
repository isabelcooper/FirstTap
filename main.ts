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
import {SqlTokenStore} from "./token/TokenStore";
import {LogOutHandler} from "./signup-logIn-logout/LogOutHandler";
require('dotenv').config();

(async () => {
  await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

  const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
  const employeeStore = new SqlEmployeeStore(database);
  const tokenStore = new SqlTokenStore(database);

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const signUpHandler = new SignUpHandler(employeeStore);
  const logInHandler = new LogInHandler(employeeStore, tokenStore, new UniqueUserIdGenerator());
  const logOutHandler = new LogOutHandler(tokenStore);

  const server = new Server(signUpHandler, logInHandler, logOutHandler, authenticator);
  server.start();
})();
