const Postgrator = require('postgrator');

export type ConnectionDetails = {
  host?: string,
  port?: number,
  user: string,
  password: string,
  database: string
}

export class PostgresMigrator {
  private migrations: any;

  constructor(private config: ConnectionDetails, private migrationsPath: string) {
    this.migrations = new Postgrator({
      migrationDirectory: this.migrationsPath,
      driver: 'pg',
      ...this.config
    });
  }

  public async migrate(): Promise<any> {
    try {
      console.log("Starting migration scripts");
      const appliedMigrations = await this.migrations.migrate();
      console.log(appliedMigrations);
      console.log("Finished migration scripts");
    } catch (e) {
      console.log(e);
      throw new Error("Migration failed: see above error.")
    }
  }
}