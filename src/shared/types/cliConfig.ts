export interface CliConfig {
  outputDir: string;
  createSubdirs: boolean;
  httpClientImportPath: string;
  apiDirName: string;
  typesDirName: string;
  hooksDirName: string;
  customFormattersEnabled: boolean;
  prettierConfigPath?: string;
  eslintConfigPath?: string;
}
