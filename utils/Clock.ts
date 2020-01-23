export const ONE_MINUTE = 1000*60;

export interface Clock {
  now(): number;
}

export class FixedClock implements Clock {
  constructor(private time: number = Date.now()) {
  }

  now(): number {
    return this.time;
  }

  moveForwardMins(numberOfMins: number) {
    this.time = this.time + (numberOfMins * ONE_MINUTE);
  }
}
