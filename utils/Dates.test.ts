import {expect} from "chai";
import {Dates} from "./Dates";

describe('Dates', () => {
  it('should add minutes', () => {
    const date = new Date(2019, 6, 18);
    const currentMinute = date.getMinutes();
    expect(Dates.addMinutes(date, 1).getDate()).to.eql(date.getDate());
    expect(Dates.addMinutes(date, 1).getMinutes()).to.eql(currentMinute + 1);
    expect(Dates.addMinutes(date, 2).getMinutes()).to.eql(currentMinute + 2);
  });

  it('should strip milliseconds from date', () => {
    const date = new Date(2019, 6, 18, 10, 10, 10, 999);
    expect(Dates.stripMillis(date)).to.eql(new Date(2019, 6, 18, 10, 10, 10, 0));
  })
});
