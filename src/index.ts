#!/usr/bin/env node

import { program } from 'commander';
import { AstGenerator } from './core/ast-generator/AstGenerator.js';
import {
  configManager,
  isEslintConfigValid,
  isPrettierConfigValid,
  JsonDataProvider,
  OpenApiDataProvider,
  runPromptWizard,
} from './features/index.js';
import { color } from './shared/index.js';

import type { DataProvider } from './shared/index.js';

const getDataProvider = (sourcePath: string): DataProvider => {
  const lowerPath = sourcePath.toLowerCase();

  if (
    sourcePath.startsWith('http://') ||
    sourcePath.startsWith('https://') ||
    lowerPath.endsWith('.yaml') ||
    lowerPath.endsWith('.yml') ||
    lowerPath.includes('swagger')
  ) {
    return new OpenApiDataProvider(sourcePath);
  }

  return new JsonDataProvider(sourcePath);
};

program
  .version('1.0.0')
  .description('CLI tool to generate TanStack CRUD hooks and interfaces')
  .option('-s, --source <type>', 'Path to the JSON schema file')
  .option(
    '-c, --config',
    'Run interactive setup wizard for generator configuration',
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
          `${color.error}Configuration file .tsgenrc.json not found${color.default}`,
        );
        console.log(
          'Initializing automatic configuration before generation...\n',
        );

        await runPromptWizard();
      }

      const activeConfig = configManager.read();

      const isPrettierValid = isPrettierConfigValid(activeConfig);
      const isEslintValid = isEslintConfigValid(activeConfig);

      try {
        const provider = getDataProvider(options.source);
        const specifications = await provider.getSpecification();

        const astGenerator = new AstGenerator(activeConfig);

        for (const spec of specifications) {
          console.log(`⏳ Generating files for an entity "${spec.name}"`);

          await astGenerator.generateEntity(spec);

          if (
            activeConfig.customFormattersEnabled &&
            activeConfig.prettierConfigPath &&
            !isPrettierValid
          ) {
            console.log(
              `${color.warning}⚠️  [Prettier] Failed to read config file at ${activeConfig.prettierConfigPath}. Built-in rules used ${color.default}`,
            );
          }

          if (
            activeConfig.customFormattersEnabled &&
            activeConfig.eslintConfigPath &&
            !isEslintValid
          ) {
            console.log(
              `${color.warning}⚠️  [ESLint] Failed to read config file at ${activeConfig.eslintConfigPath}. Built-in rules used${color.default}`,
            );
          }

          console.log(
            `${color.success}"Files generated successfully!"${color.default}`,
          );
        }
      } catch (err) {
        console.error(
          `${color.error}CLI execution error: ${err}${color.default}`,
        );
        process.exit(1);
      }
      return;
    }

    console.log(
      `${color.error}Error: Please specify at least one working flag${color.default}`,
    );
    console.log(
      'Use: \n tsgen -s <path_to_scheme> (for generation) \n tsgen -c (for configuration)',
    );
    process.exit(1);
  });

program.parse(process.argv);
