#!/usr/bin/env node

import { program } from "commander";
import { runPromptWizard } from "./features/prompt-wizard/promptWizard.js";
import { JsonDataProvider } from "./features/data-providers/JsonDataProvider.js";
import { AstGenerator } from "./core/ast-generator/AstGenerator.js";
import { configManager } from "./features/config-manager/configManager.js";
import { DataProvider } from "./shared/types/dataProvider.js";

const greenText = "\x1b[32m";
const redText = "\x1b[31m";
const resetText = "\x1b[0m";

function getDataProvider(sourcePath: string): DataProvider {
  const lowerPath = sourcePath.toLowerCase();

  if (
    sourcePath.startsWith("http://") ||
    sourcePath.startsWith("https://") ||
    lowerPath.endsWith(".yaml") ||
    lowerPath.endsWith(".yml") ||
    lowerPath.includes("swagger")
  ) {
    // return new OpenApiDataProvider(sourcePath);
  }

  return new JsonDataProvider(sourcePath);
}

program
  .version("1.0.0")
  .description("CLI tool to generate TanStack CRUD hooks and interfaces")
  .option("-s, --source <type>", "Path to the JSON schema file")
  .option(
    "-c, --config",
    "Run interactive setup wizard for generator configuration",
  )
  .action(async (options) => {
    if (options.config) {
      await runPromptWizard();

      if (!options.source) {
        process.exit(0);
      }
    }

    if (options.source) {
      if (!configManager.exists()) {
        console.log(
          `${redText}Файл конфигурации .tsgenrc.json не найден.${resetText}`,
        );
        console.log(
          "Инициализируем автоматическую настройку перед генерацией...\n",
        );

        await runPromptWizard();
      }

      const activeConfig = configManager.read();

      try {
        const provider = getDataProvider(options.source);
        const specifications = await provider.getSpecification();

        const astGenerator = new AstGenerator(activeConfig);

        for (const spec of specifications) {
          console.log(`⏳ Generating files for an entity "${spec.name}"`);

          await astGenerator.generateEntity(spec);

          console.log(
            `${greenText}"Files generated successfully!"${resetText}`,
          );
        }
      } catch (err) {
        console.error(`${redText}Ошибка выполнения CLI: ${err}${resetText}`);
        process.exit(1);
      }
      return;
    }

    console.log(
      `${redText}Ошибка: Укажите хотя бы один рабочий флаг.${resetText}`,
    );
    console.log(
      "Используйте: \n  tsgen -s <путь_к_схеме> (для генерации) \n  tsgen -c (для настройки конфигурации)",
    );
    process.exit(1);
  });

program.parse(process.argv);
