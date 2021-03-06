import {Server} from "./server/server";
import {SignUpHandler} from "./src/signup-logIn-logout/SignUpHandler";
import {InMemoryEmployeeStore} from "./src/signup-logIn-logout/EmployeeStore";
import {InternalAuthenticator} from "./src/systemAuth/Authenticator";
import {LogInHandler} from "./src/signup-logIn-logout/LogInHandler";
import {InMemoryTokenStore} from "./src/userAuthtoken/TokenStore";
import {LogOutHandler} from "./src/signup-logIn-logout/LogOutHandler";
import {UniqueUserIdGenerator} from "./utils/IdGenerator";
import {TokenManager} from "./src/userAuthtoken/TokenManager";
import {BalanceHandler} from "./src/transactions/BalanceHandler";
import {TransactionManager} from "./src/transactions/TransactionManager";
import {InMemoryTransactionStore} from "./src/transactions/TransactionStore";

(async () => {
  const clock = Date;

  const authenticator = new InternalAuthenticator({
    username: process.env.FIRSTTAP_CLIENT_USERNAME as string,
    password: process.env.FIRSTTAP_CLIENT_PASSWORD as string
  });

  const employeeStore = new InMemoryEmployeeStore();
  const tokenStore = new InMemoryTokenStore();
  const transactionStore = new InMemoryTransactionStore();

  const tokenManager = new TokenManager(tokenStore, new UniqueUserIdGenerator(), clock);
  const transactionManager = new TransactionManager(employeeStore, transactionStore);

  const signUpHandler = new SignUpHandler(employeeStore, tokenManager);
  const logInHandler = new LogInHandler(employeeStore, tokenManager);
  const logOutHandler = new LogOutHandler(tokenManager);
  const topUpHandler = new BalanceHandler(tokenManager, transactionManager);

  const server = new Server(authenticator, signUpHandler, logInHandler, logOutHandler, topUpHandler);
  server.start();
})();
