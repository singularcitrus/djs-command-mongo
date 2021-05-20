import { MongoClientOptions } from "mongodb";

export interface MongoosePermissionsOptions {
  permissions?: string[];
  mongoOptions?: MongoClientOptions;
  rootAccount: string;
}
