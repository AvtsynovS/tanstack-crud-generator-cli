import fs from 'fs-extra';
import path from 'path';
import { DEFAULT_CONFIG } from '../../shared/index.js';

import type { CliConfig } from '../../shared/index.js';

const CONFIG_FILE_NAME = '.tsgenrc.json';

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
