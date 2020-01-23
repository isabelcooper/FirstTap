import moment = require('moment');

export const ONE_MINUTE_IN_SECONDS = 60;

export const ONE_MINUTE_IN_MILLIS = 1000*ONE_MINUTE_IN_SECONDS;

export class Dates {
  static addMinutes(date: Date, numberOfMinutes: number) {
    return new Date(date.getTime() + numberOfMinutes * ONE_MINUTE_IN_MILLIS);
  }

  static stripMillis(date: Date) {
    const dateWithoutMillis = new Date(date);
    dateWithoutMillis.setMilliseconds(0);
    return dateWithoutMillis;
  }
}
