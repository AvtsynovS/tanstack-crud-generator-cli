import fs from 'fs-extra';
import path from 'path';

export interface CliConfig {
  outputDir: string;
  createSubdirs: boolean;
  apiDirName: string;
  typesDirName: string;
  hooksDirName: string;
  customFormattersEnabled: boolean;
  prettierConfigPath?: string;
  eslintConfigPath?: string;
}

const CONFIG_FILE_NAME = '.tsgenrc.json';

export const DEFAULT_CONFIG: CliConfig = {
  outputDir: './',
  createSubdirs: true,
  apiDirName: 'api',
  typesDirName: 'types',
  hooksDirName: 'hooks',
  customFormattersEnabled: false,
};

const getConfigPath = (): string => path.join(process.cwd(), CONFIG_FILE_NAME);

export const configManager = {
  exists(): boolean {
    return fs.existsSync(getConfigPath());
  },

  read(): CliConfig {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
      return DEFAULT_CONFIG;
    }
    try {
      const userConfig = fs.readJsonSync(configPath);
      return { ...DEFAULT_CONFIG, ...userConfig };
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  write(newConfig: Partial<CliConfig>): void {
    const configPath = getConfigPath();
    const currentConfig = fs.existsSync(configPath)
      ? this.read()
      : DEFAULT_CONFIG;

    fs.writeJsonSync(
      configPath,
      { ...currentConfig, ...newConfig },
      { spaces: 2 },
    );
  },
};
