import {InternalAuthenticator} from "./Authenticator";
import {Random} from "../../utils/Random";
import {ResOf} from "http4js/core/Res";
import {Method} from "http4js/core/Methods";
import {ReqOf} from "http4js/core/Req";
import {expect} from "chai";

require('dotenv').config();

describe('Authenticator', () => {
  const correctUsername = process.env.FIRSTTAP_CLIENT_USERNAME as string;
  const correctPassword = process.env.FIRSTTAP_CLIENT_PASSWORD as string;

  const stubbedHandler = async () => ResOf(200, 'got here!');

  const userAuthDetails = {username: correctUsername, password: correctPassword || ''};
  const authenticatedHandler = new InternalAuthenticator(userAuthDetails);

  it('should pass through to underlying handler if auth details are correct', async () => {
    const encodedCredentials = Buffer.from(`${correctUsername}:${correctPassword}`).toString('base64');
    const authHeaders = {'authorization': `Basic ${encodedCredentials}`};

    const req = ReqOf(Method.GET, `/`, undefined, authHeaders);
    const response = await authenticatedHandler.authFilter(stubbedHandler).handle(req);

    expect(response.status).to.eql(200);
    expect(response.bodyString()).to.eql('got here!');
  });

  it('should not handle req but return err if password is incorrect', async () => {
    const incorrectPassword = Random.string('incorrectPassword');
    const encodedCredentials = Buffer.from(`${correctUsername}:${incorrectPassword}`).toString('base64');
    const authHeaders = {'authorization': `Basic ${encodedCredentials}`};

    let req = ReqOf(Method.GET, `/`, undefined, authHeaders);
    const response = await authenticatedHandler.authFilter(stubbedHandler).handle(req);

    expect(response.status).to.eql(401);
    expect(response.bodyString()).to.eql('Client not authenticated');
    expect(response.headers).to.eql({'WWW-Authenticate': 'Basic realm="Entity resource"'});
  });
});
