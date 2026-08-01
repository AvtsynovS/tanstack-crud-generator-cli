import { CliConfig } from '../types/cliConfig.js';

export const color = {
  default: '\x1b[0m',
  success: '\x1b[32m',
  warning: '\x1b[33m',
  error: '\x1b[31m',
};

export const DEFAULT_CONFIG: CliConfig = {
  outputDir: './',
  createSubdirs: true,
  httpClientImportPath: '@common/data-access',
  apiDirName: 'api',
  typesDirName: 'types',
  hooksDirName: 'hooks',
  customFormattersEnabled: false,
};
