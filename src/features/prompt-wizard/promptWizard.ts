import * as prompts from "@clack/prompts";
import {
  configManager,
  CliConfig,
  DEFAULT_CONFIG,
} from "../config-manager/configManager.js";

export const runPromptWizard = async (): Promise<CliConfig> => {
  const currentConfig = configManager.read();

  prompts.intro("🪄  TanStack CRUD Generator: Настройка конфигурации");

  const structureAnswers = await prompts.group(
    {
      outputDir: () =>
        prompts.text({
          message: "Укажите родительскую директорию для генерации кода:",
          placeholder: DEFAULT_CONFIG.outputDir,
          initialValue: currentConfig.outputDir,
        }),
      createSubdirs: () =>
        prompts.confirm({
          message:
            "Создавать изолированную подпапку с названием сущности (например, /todo) внутри родительской директории?",
          initialValue: currentConfig.createSubdirs,
        }),
    },
    {
      onCancel: () => {
        prompts.cancel("Настройка отменена");
        process.exit(0);
      },
    },
  );

  let subdirsAnswers = {
    apiDirName: currentConfig.apiDirName,
    typesDirName: currentConfig.typesDirName,
    hooksDirName: currentConfig.hooksDirName,
  };

  const names = await prompts.group(
    {
      apiDirName: () =>
        prompts.text({
          message: "Название директории для API-методов:",
          placeholder: DEFAULT_CONFIG.apiDirName,
          initialValue: currentConfig.apiDirName,
        }),
      typesDirName: () =>
        prompts.text({
          message: "Название директории для TypeScript-типов:",
          placeholder: DEFAULT_CONFIG.typesDirName,
          initialValue: currentConfig.typesDirName,
        }),
      hooksDirName: () =>
        prompts.text({
          message: "Название директории для TanStack-хуков:",
          placeholder: DEFAULT_CONFIG.hooksDirName,
          initialValue: currentConfig.hooksDirName,
        }),
    },
    {
      onCancel: () => {
        prompts.cancel("Настройка отменена");
        process.exit(0);
      },
    },
  );

  subdirsAnswers = names;

  const wantsLinters = await prompts.confirm({
    message:
      "Хотите указать пути к файлам настроек ESLint / Prettier для форматирования кода?",
    initialValue: currentConfig.customFormattersEnabled,
  });

  if (prompts.isCancel(wantsLinters)) {
    prompts.cancel("Настройка отменена.");
    process.exit(0);
  }

  let prettierConfigPath: string | undefined = currentConfig.prettierConfigPath;
  let eslintConfigPath: string | undefined = currentConfig.eslintConfigPath;

  if (wantsLinters) {
    const prettierPath = await prompts.text({
      message:
        "Введите относительный путь до файла .prettierrc (Enter, чтобы пропустить):",
      placeholder: "./.prettierrc",
      initialValue: currentConfig.prettierConfigPath || "",
    });

    if (prompts.isCancel(prettierPath)) {
      prompts.cancel("Настройка отменена");
      process.exit(0);
    }

    const eslintPath = await prompts.text({
      message:
        "Введите относительный путь до файла конфигурации ESLint (Enter, чтобы пропустить):",
      placeholder: "./eslint.config.js",
      initialValue: currentConfig.eslintConfigPath || "",
    });

    if (prompts.isCancel(eslintPath)) {
      prompts.cancel("Настройка отменена");
      process.exit(0);
    }

    prettierConfigPath =
      typeof prettierPath === "string" && prettierPath.trim()
        ? prettierPath.trim()
        : undefined;
    eslintConfigPath =
      typeof eslintPath === "string" && eslintPath.trim()
        ? eslintPath.trim()
        : undefined;
  } else {
    prettierConfigPath = undefined;
    eslintConfigPath = undefined;
  }

  const finalConfig: CliConfig = {
    outputDir: structureAnswers.outputDir.trim(),
    createSubdirs: structureAnswers.createSubdirs,
    apiDirName: subdirsAnswers.apiDirName.trim(),
    typesDirName: subdirsAnswers.typesDirName.trim(),
    hooksDirName: subdirsAnswers.hooksDirName.trim(),
    customFormattersEnabled: wantsLinters,
    prettierConfigPath,
    eslintConfigPath,
  };

  configManager.write(finalConfig);

  prompts.outro("🎉 Файл конфигурации .tsgenrc.json успешно сохранен!");

  return finalConfig;
};
