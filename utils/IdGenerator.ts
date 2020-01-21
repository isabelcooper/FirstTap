import uuid = require("uuid");

export interface IdGenerator {
  createToken(): string;
}

export class FixedIdGenerator implements IdGenerator {
  constructor(private id: string = 'noId'){}

  createToken() {
    return this.id
  }

  setId(id: string) {
    this.id = id
  }
}

export class UniqueUserIdGenerator implements IdGenerator {
  createToken(): string {
    return uuid.v4();
  }
}
