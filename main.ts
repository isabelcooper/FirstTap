import {Server} from "./server/server";
import {SignUpHandler} from "./src/signup-logIn-logout/SignUpHandler";
import {PostgresMigrator} from "./database/postgres/PostgresMigrator";
import {EVENT_STORE_CONNECTION_DETAILS} from "./config/prod";
import {PostgresDatabase} from "./database/postgres/PostgresDatabase";
import {Pool} from "pg";
import {InternalAuthenticator} from "./src/systemAuth/Authenticator";
import {LogInHandler} from "./src/signup-logIn-logout/LogInHandler";
import {LogOutHandler} from "./src/signup-logIn-logout/LogOutHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {TokenManager} from "./src/userAuthtoken/TokenManager";
import {BalanceHandler} from "./src/transactions/BalanceHandler";
import {TransactionManager} from "./src/transactions/TransactionManager";
import {SqlTokenStore} from "./src/userAuthtoken/SqlTokenStore";
import {SqlEmployeeStore} from "./src/signup-logIn-logout/SqlEmployeeStore";
import {SqlTransactionStore} from "./src/transactions/SqlTransactionStore";

(async () => {
  const clock = Date;
  await new PostgresMigrator(EVENT_STORE_CONNECTION_DETAILS, './database/migrations').migrate();

  const database = new PostgresDatabase(new Pool(EVENT_STORE_CONNECTION_DETAILS));
  const employeeStore = new SqlEmployeeStore(database);
  const tokenStore = new SqlTokenStore(database);
  const transactionStore = new SqlTransactionStore(database);

  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator(), clock);
  const transactionManager = new TransactionManager(employeeStore, transactionStore);

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);
  const topUpHandler = new BalanceHandler(tokenManager, transactionManager);

  const server = new Server(authenticator, signUpHandler, logInHandler, logOutHandler, topUpHandler);
  server.start();
})();
