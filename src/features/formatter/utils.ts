import path from 'path';
import fs from 'fs';
import { CliConfig } from '../config-manager/configManager.js';

export const isPrettierConfigValid = (config: CliConfig) => {
  if (!config.customFormattersEnabled || !config.prettierConfigPath) {
    return true;
  }
  const absolutePath = path.resolve(process.cwd(), config.prettierConfigPath);
  return fs.existsSync(absolutePath);
};
