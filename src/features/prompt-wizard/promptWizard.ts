import * as prompts from "@clack/prompts";
import { configManager, CliConfig } from "../config-manager/configManager.js";

export const runPromptWizard = async (): Promise<CliConfig> => {
  if (configManager.hasFormatterConfig()) {
    return configManager.read() || {};
  }

  prompts.intro("🪄  TanStack CRUD Generator CLI Настройка");

  const wantsConfig = await prompts.confirm({
    message:
      "Хотите указать пути к файлам настроек ESLint / Prettier для форматирования кода?",
    initialValue: true,
  });

  if (prompts.isCancel(wantsConfig)) {
    prompts.cancel("Операция отменена.");
    process.exit(0);
  }

  const resultConfig: CliConfig = {};

  if (wantsConfig) {
    const prettierPath = await prompts.text({
      message:
        "Введите относительный путь до файла .prettierrc (или нажмите Enter, чтобы пропустить):",
      placeholder: "./.prettierrc",
    });

    if (prompts.isCancel(prettierPath)) {
      prompts.cancel("Операция отменена.");
      process.exit(0);
    }

    const eslintPath = await prompts.text({
      message:
        "Введите относительный путь до файла конфигурации ESLint (или нажмите Enter, чтобы пропустить):",
      placeholder: "./eslint.config.js",
    });

    if (prompts.isCancel(eslintPath)) {
      prompts.cancel("Операция отменена.");
      process.exit(0);
    }

    if (typeof prettierPath === "string" && prettierPath.trim()) {
      resultConfig.prettierConfigPath = prettierPath.trim();
    }
    if (typeof eslintPath === "string" && eslintPath.trim()) {
      resultConfig.eslintConfigPath = eslintPath.trim();
    }

    configManager.write(resultConfig);
  }

  prompts.outro("🎉 Настройка контекста успешно завершена!");

  return resultConfig;
};
