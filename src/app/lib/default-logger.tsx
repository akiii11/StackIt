import { config } from "../../../config";
import { createLogger } from "./logger";

export const logger = createLogger({ level: config.logLevel });
