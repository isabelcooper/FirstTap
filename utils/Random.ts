export class Random {
  public static integer(max: number = 1000000000, min: number = 0) {
    return  min + Math.floor(Math.random() * (max-min))
  }

  public static string(prefix = 'string', maxLength?: number) {
    let randomString = `${prefix}${Random.integer()}`;
    return maxLength && randomString.length > maxLength ? randomString.substring(0, maxLength) : randomString;
  }

  public static oneOf<T>(arr: T[]): T {
    return arr[Random.integer(arr.length - 1)];
  }

  static date() {
    return new Date(Date.now() - Random.integer(10000000))
  }

  static boolean() {
    return Random.integer() < 500000000;
  }

  static number(min: number = 0, max: number = 10000000) {
    return min + (Math.random() * (max-min));
  }

  static url(path: string = '') {
    return `https://${Random.string()}.com${path.length > 0 ? `/${path}`: ''}`;
  }
}
