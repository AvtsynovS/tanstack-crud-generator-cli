#!/usr/bin/env node

import { program } from "commander";
import { runPromptWizard } from "./features/prompt-wizard/promptWizard.js";
import { JsonDataProvider } from "./features/data-providers/JsonDataProvider.js";
import { AstGenerator } from "./core/ast-generator/AstGenerator.js";

const greenText = "\x1b[32m";
const redText = "\x1b[31m";
const resetText = "\x1b[0m";

program
  .version("1.0.0")
  .description("CLI tool to generate TanStack CRUD hooks and interfaces")
  .requiredOption("-s, --source <type>", "Path to the JSON schema file")
  .action(async (options) => {
    // Интерактивный диалог для установки конфигураций форматирования
    const formatterConfig = await runPromptWizard();

    // Временный лог при записи правил форматирования
    if (Object.keys(formatterConfig).length > 0) {
      console.log(
        `${greenText}Используются пути форматирования:${resetText}`,
        formatterConfig,
      );
    }

    try {
      // Получаем структурированные данные из провайдера
      const provider = new JsonDataProvider(options.source);
      const specifications = await provider.getSpecification();

      const astGenerator = new AstGenerator();

      for (const spec of specifications) {
        console.log(`⏳ Generating files for an entity "${spec.name}"`);

        await astGenerator.generateEntity(spec);

        console.log(`${greenText}"Files generated successfully!"${resetText}`);
      }
    } catch (err) {
      console.error(`${redText}Ошибка выполнения CLI: ${err}${resetText}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
