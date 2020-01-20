import {ConnectionDetails} from "../database/postgres/PostgresMigrator";

export const getFirstTapConnectionDetails = (port: number): ConnectionDetails => {
  return {
    host: 'localhost',
    port: port,
    user: 'postgres',
    password: '',
    database: 'firsttap'
  }
};
