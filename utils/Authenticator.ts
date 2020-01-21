import {asHandler, Handler, HttpHandler} from 'http4js/core/HttpMessage';
import {Req, ResOf} from 'http4js';

export interface BasicAuthCredentials {
  username: string;
  password: string
};

export interface Authenticator {
  authFilter(handler: Handler | HttpHandler): Handler;
}

export class InternalAuthenticator implements Authenticator {
  constructor(private credentials: BasicAuthCredentials) {
  }

  authFilter(handler: Handler | HttpHandler): Handler {
    return asHandler(async (req: Req) => {
      const header = req.header('authorization');
      const authHeader = (header && header.slice(6)) || '';
      console.log(authHeader);
      let buffer = Buffer.from(authHeader, 'base64');
      console.log('buffer', buffer);
      let fullString = buffer.toString();
      console.log('fullString', fullString);
      const [username, password] = fullString.split(':');
      console.log(username, password);
      if (username !== this.credentials.username || password !== this.credentials.password) {
        return ResOf(401, 'Client not authenticated', {'WWW-Authenticate': 'Basic realm="Entity resource"'});
      }
      return asHandler(handler).handle(req);
    })
  }
}
