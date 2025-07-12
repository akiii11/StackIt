import { getSiteURL } from "@/app/lib/get-site-url";
import { LogLevel } from "@/app/lib/logger";

export interface Config {
  site: { name: string; description: string; themeColor: string; url: string };
  logLevel: keyof typeof LogLevel;
}

export const config: Config = {
  site: {
    name: "Stackit",
    description: "Smart way to track your expenses.",
    themeColor: "#090a0b",
    url: getSiteURL(),
  },
  logLevel:
    (process.env.NEXT_PUBLIC_LOG_LEVEL as keyof typeof LogLevel) ??
    LogLevel.ALL,
};
