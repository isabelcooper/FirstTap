import {Server} from "./server/server";
import {SignUpHandler} from "./src/signup-logIn-logout/SignUpHandler";
import {PostgresMigrator} from "./database/postgres/PostgresMigrator";
import {EVENT_STORE_CONNECTION_DETAILS} from "./config/prod";
import {PostgresDatabase} from "./database/postgres/PostgresDatabase";
import {Pool} from "pg";
import {SqlEmployeeStore} from "./src/signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./src/systemAuth/Authenticator";
import {LogInHandler} from "./src/signup-logIn-logout/LogInHandler";
import {SqlTokenStore} from "./src/userAuthtoken/TokenStore";
import {LogOutHandler} from "./src/signup-logIn-logout/LogOutHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {TokenManager} from "./src/userAuthtoken/TokenManager";
import {TopUpHandler} from "./src/topup/TopUpHandler";

(async () => {
  const clock = Date;
  await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

  const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
  const employeeStore = new SqlEmployeeStore(database);
  const tokenStore = new SqlTokenStore(database);
  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator(), clock);

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  console.log('EVENT_STORE_CONNECTION_DETAILS',EVENT_STORE_CONNECTION_DETAILS)

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);
  const topUpHandler = new TopUpHandler(tokenManager, employeeStore);

  const server = new Server(authenticator, signUpHandler, logInHandler, logOutHandler, topUpHandler);
  server.start();
})();
