import {expect} from 'chai';
import {Random} from "./Random";

describe('Random', () => {
  it('produces a random number between a min and max', () => {
    const number = Random.number(0, 1);
    expect(number).to.be.greaterThan(0);
    expect(number).to.be.lessThan(1);
  });

  it('produces a random number greater than or equal to the minimum', () => {
    const number = Random.number(999, 1000);
    expect(number).to.be.greaterThan(998.9);
  });

  it('returns one of a given array', () => {
    expect(Random.oneOf([1])).to.eql(1);
    expect(Random.oneOf([1,2])).to.be.oneOf([1,2]);
  });

  it('produces an even distribution between two numbers (max 5% variation)', () => {
    const numbers = [...new Array(1000000)].map(() => Random.number(0, 1).toFixed(2));
    const seed: {[key: string]:number} = {};
    const distribution = numbers.reduce((dist: {[key:string]: number}, number) => {
      dist[number] = dist[number] ? dist[number]+1 : 1;
      return dist;
    }, seed);
    Object.values(distribution).forEach((count: number) => {
      const variation = (count - 10000)/10000;
      expect(variation).to.be.lessThan(0.05);
    });
  })
});