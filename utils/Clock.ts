export const ONE_HOUR = 1000*60*60;

export interface Clock {
  now(): number;
}

export class FixedClock implements Clock {
  constructor(private time: number = Date.now()) {
  }

  now(): number {
    return this.time;
  }

  moveForwardADay() {
    this.time = this.time + ONE_HOUR*24;
  }

  moveForwardAnHour() {
    this.time = this.time + ONE_HOUR;

  }
}