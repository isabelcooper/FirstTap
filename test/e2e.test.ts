import {ReqOf} from "http4js/core/Req";
import {HttpClient} from "http4js/client/HttpClient";
import {Method} from "http4js/core/Methods";
import {expect} from "chai";
import {Server} from "../src/server";
import {Random} from "../utils/Random";

describe.skip('Server', () => {
  const httpClient = HttpClient;
  const port = 3333;
  let server: Server;

  beforeEach(async () => {
    server = new Server(port);
    server.start();
  });

  afterEach(async () => {
    server.stop();
  });

  it('should allow an unknown user to register', async () =>{
    const name = Random.string();
    const response = await httpClient(ReqOf(Method.POST, `http://localhost:${port}/login`, JSON.stringify({name})));
    expect(response.status).to.eql(200);
    expect(JSON.parse(response.bodyString())).to.eql({name});
  });

});
