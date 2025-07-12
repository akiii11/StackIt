export enum ServerCodes {
  Success = 2000,
  AuthError = 2001,
  DbError = 2002,
  ValidationError = 2003,
  InvalidArgs = 2004,
  UnknownError = 3000,
}
export class Constants {
  static readonly SECRET_JWT_KEY = "stackit";
  static readonly baseURL = process.env.NEXT_PUBLIC_SERVER_URL + "/api/";
}
