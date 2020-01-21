import {expect} from "chai";
import {Dates} from "./Dates";
import {Random} from "./Random";

describe('Dates', () => {
  describe('dayRange', () => {
    it('should produce a range between 2 given dates', () => {
      const dates = Dates.dayRange(new Date(2019, 5, 1), new Date(2019, 5, 4));
      expect(dates).to.eql([
        Dates.endOfDay(new Date(2019, 5, 1)),
        Dates.endOfDay(new Date(2019, 5, 2)),
        Dates.endOfDay(new Date(2019, 5, 3)),
        Dates.endOfDay(new Date(2019, 5, 4))
      ]);
    });

    it('should produce a range between 2 given dates regardless of order', () => {
      const dates = Dates.dayRange(new Date(2019, 5, 4), new Date(2019, 5, 1));
      expect(dates).to.eql([
        Dates.endOfDay(new Date(2019, 5, 1)),
        Dates.endOfDay(new Date(2019, 5, 2)),
        Dates.endOfDay(new Date(2019, 5, 3)),
        Dates.endOfDay(new Date(2019, 5, 4))
      ]);
    });

    it('should disregard time', () => {
      const dates = Dates.dayRange(new Date(2019, 5, 4, 10, 11, 30), new Date(2019, 5, 1, 12, 10, 1));
      expect(dates).to.eql([
        Dates.endOfDay(new Date(2019, 5, 1)),
        Dates.endOfDay(new Date(2019, 5, 2)),
        Dates.endOfDay(new Date(2019, 5, 3)),
        Dates.endOfDay(new Date(2019, 5, 4))
      ])
    });
  });

  describe('hourRange', () => {
    it('should produce an hourly range between 2 given dates', () => {
      const dates = Dates.hourRange(new Date(2019, 5, 1, 9), new Date(2019, 5, 1, 13));
      expect(dates).to.eql([
        Dates.startOfHour(new Date(2019, 5, 1, 9)),
        Dates.startOfHour(new Date(2019, 5, 1, 10)),
        Dates.startOfHour(new Date(2019, 5, 1, 11)),
        Dates.startOfHour(new Date(2019, 5, 1, 12)),
        Dates.startOfHour(new Date(2019, 5, 1, 13)),
      ]);
    });
  });

  describe('startOfWeek', () => {
    it('should produce a date object at the start of the week', () => {
      const startOfWeek = Dates.startOfWeek(new Date(2019, 6, 31, 8, 0, 0, 0));
      expect(startOfWeek).to.eql(new Date(2019, 6, 28, 8, 0, 0, 0));
    });
  });

  it('should parse a string into a date, given a known format', () => {
    const date = Random.date();
    const formattedDate = Dates.format(date, Dates.YYYY_DASH_MM_DASH_DD);
    const parsedDate = Dates.parse(formattedDate, Dates.YYYY_DASH_MM_DASH_DD);

    expect(Dates.startOfDay(date).getTime()).to.eql(parsedDate.getTime());
  });

  it('should format a date into a string', () => {
    const date = new Date(2019, 6, 18);
    const formattedDate = Dates.format(date, Dates.YYYY_DASH_MM_DASH_DD);

    expect(formattedDate).to.eql('2019-07-18');
  });

  it('should add days', () => {
    const date = new Date(2019, 6, 18);
    expect(Dates.addDays(date, 1)).to.eql(new Date(2019, 6, 19));
    expect(Dates.addDays(date, 2)).to.eql(new Date(2019, 6, 20));
  });

  it('should strip milliseconds from date', () => {
    const date = new Date(2019, 6, 18, 10, 10, 10, 999);
    expect(Dates.stripMillis(date)).to.eql(new Date(2019, 6, 18, 10, 10, 10, 0));
  })
});
