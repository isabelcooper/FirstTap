import {expect} from "chai";
import {run} from "./main";

describe('Test env set up', () => {
  it('should return true', async () => {
    expect(run()).to.eql(true)
  });
});
