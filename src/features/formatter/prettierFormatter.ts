import prettier from 'prettier';
import path from 'path';
import fs from 'fs';

import { color } from '../../shared/index.js';

import type { CliConfig } from '../../shared/index.js';

const DEFAULT_PRETTIER_OPTIONS: prettier.Options = {
  parser: 'typescript',
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  semi: true,
  printWidth: 80,
  endOfLine: 'lf',
  bracketSpacing: true,
  singleAttributePerLine: false,
};

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
