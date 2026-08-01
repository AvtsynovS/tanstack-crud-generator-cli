import fs from 'fs';
import path from 'path';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import { ESLint, Linter } from 'eslint';
import { defineConfig } from 'eslint/config';

import type { CliConfig } from '../../shared/index.js';

const DEFAULT_TS_ESLINT_CONFIG = defineConfig(js.configs.recommended, {
  files: ['**/*.ts'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
  },
  plugins: {
    '@typescript-eslint': tseslint.plugin,
  },
  rules: {
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
    semi: ['error', 'always'],

    'padding-line-between-statements': [
      'error',
      { blankLine: 'always', prev: '*', next: 'export' },
      { blankLine: 'always', prev: 'const', next: 'const' },
      { blankLine: 'any', prev: 'import', next: 'import' },
    ],
  },
} satisfies Linter.Config);

export const formatWithEslint = async (
  rawCode: string,
  filePath: string,
  config: CliConfig,
) => {
  let eslintInstance: ESLint;

  try {
    const absoluteUserPath = config.eslintConfigPath
      ? path.resolve(process.cwd(), config.eslintConfigPath)
      : '';

    const hasCustomConfig =
      config.customFormattersEnabled &&
      absoluteUserPath &&
      fs.existsSync(absoluteUserPath);

    if (hasCustomConfig) {
      eslintInstance = new ESLint({
        fix: true,
        overrideConfigFile: absoluteUserPath,
      });
    } else {
      eslintInstance = new ESLint({
        fix: true,
        overrideConfigFile: true,
        overrideConfig: DEFAULT_TS_ESLINT_CONFIG,
      });
    }

    const results = await eslintInstance.lintText(rawCode, { filePath });

    if (results && results[0]) {
      return results[0].output ?? rawCode;
    }
  } catch (error) {
    console.error('💥 ESLINT CRITICAL ERROR:', error);
  }

  return rawCode;
};
