import path from 'path';
import fs from 'fs';

import type { CliConfig } from '../../shared/index.js';

export const isPrettierConfigValid = (config: CliConfig) => {
  if (!config.customFormattersEnabled || !config.prettierConfigPath) {
    return true;
  }
  const absolutePath = path.resolve(process.cwd(), config.prettierConfigPath);
  return fs.existsSync(absolutePath);
};

export const isEslintConfigValid = (config: CliConfig) => {
  if (!config.customFormattersEnabled || !config.eslintConfigPath) {
    return true;
  }
  const absolutePath = path.resolve(process.cwd(), config.eslintConfigPath);
  return fs.existsSync(absolutePath);
};
