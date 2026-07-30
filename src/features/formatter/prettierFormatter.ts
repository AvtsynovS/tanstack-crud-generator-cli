import prettier from 'prettier';
import path from 'path';
import fs from 'fs';
import { CliConfig } from '../config-manager/configManager.js';
import { DEFAULT_PRETTIER_OPTIONS } from './prettierConfig.js';
import { color } from '../../shared/config/constants.js';

export const formatWithPrettier = async (
  rawCode: string,
  config: CliConfig,
) => {
  let prettierOptions: prettier.Options = DEFAULT_PRETTIER_OPTIONS;

  if (config.customFormattersEnabled && config.prettierConfigPath) {
    const absolutePrettierPath = path.resolve(
      process.cwd(),
      config.prettierConfigPath,
    );

    try {
      if (fs.existsSync(absolutePrettierPath)) {
        const userOptions = await prettier.resolveConfig(absolutePrettierPath);
        if (userOptions) {
          prettierOptions = { ...prettierOptions, ...userOptions };
        }
      }
    } catch {
      console.log(
        `${color.warning}⚠️  [Prettier] Failed to read config file at ${config.prettierConfigPath}. Built-in rules used ${color.default}`,
      );
    }
  }

  return prettier.format(rawCode, prettierOptions);
};
