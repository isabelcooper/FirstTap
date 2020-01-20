import {ConnectionDetails} from "../database/postgres/PostgresMigrator";

export const EVENT_STORE_CONNECTION_DETAILS : ConnectionDetails = {
  host: `/cloudsql/firsttap:europe-west1:firsttap`,
  user: 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  database: 'firsttap'
};
