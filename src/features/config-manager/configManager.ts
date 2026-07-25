import fs from "fs-extra";
import path from "path";

export interface CliConfig {
  prettierConfigPath?: string;
  eslintConfigPath?: string;
}

const CONFIG_FILE_NAME = ".tsgenrc.json";

// Получаем путь к конфигу в текущей рабочей директории пользователя
const getConfigPath = (): string => path.join(process.cwd(), CONFIG_FILE_NAME);

export const configManager = {
  read(): CliConfig | null {
    const configPath = getConfigPath();
    if (!fs.existsSync(configPath)) {
      return null;
    }
    try {
      return fs.readJsonSync(configPath);
    } catch {
      return null;
    }
  },

  write(newConfig: CliConfig): void {
    const configPath = getConfigPath();
    const currentConfig = this.read() || {};
    fs.writeJsonSync(
      configPath,
      { ...currentConfig, ...newConfig },
      { spaces: 2 },
    );
  },

  hasFormatterConfig(): boolean {
    const config = this.read();
    return !!(config?.prettierConfigPath || config?.eslintConfigPath);
  },
};
