import {StartedTestContainer} from 'testcontainers/dist/test-container';
import {GenericContainer} from 'testcontainers';
import * as path from "path";
import {Pool} from 'pg';
import {PostgresMigrator} from "./PostgresMigrator";
import {PostgresDatabase} from "./PostgresDatabase";
import {getFirstTapConnectionDetails} from "../../config/test";

export class PostgresTestServer {
  private postgres?: StartedTestContainer;

  public async start() {
    this.postgres = await new GenericContainer('postgres', '9.6-alpine')
      .withExposedPorts(5432)
      .start();
    const mappedPort = this.postgres.getMappedPort(5432);
    return {
      host: 'localhost',
      port: mappedPort,
      user: 'postgres',
      password: '',
      database: 'postgres'
    };
  }

  public async startAndGetFirstTapDatabase(): Promise<PostgresDatabase> {
    const adminConnectionDetails = await this.start();
    await new PostgresMigrator(adminConnectionDetails, path.resolve('./database/bootstrap')).migrate();

    const firstTapConnectionDetails = getFirstTapConnectionDetails(adminConnectionDetails.port);

    await new PostgresMigrator(firstTapConnectionDetails, path.resolve('./database/migrations')).migrate();
    return new PostgresDatabase(new Pool(firstTapConnectionDetails));
  }

  public async stop() {
    await this.postgres!.stop();
  }

}
