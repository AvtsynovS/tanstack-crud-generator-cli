import * as prompts from '@clack/prompts';
import { configManager } from '../config-manager/configManager.js';
import { color, DEFAULT_CONFIG } from '../../shared/index.js';

import type { CliConfig } from '../../shared/index.js';

export const runPromptWizard = async (): Promise<CliConfig> => {
  const currentConfig = configManager.read();

  prompts.intro('🪄  TanStack CRUD Generator: Configuration setup');

  const structureAnswers = await prompts.group(
    {
      outputDir: () =>
        prompts.text({
          message: 'Enter the parent directory for code generation:',
          placeholder: DEFAULT_CONFIG.outputDir,
          initialValue: currentConfig.outputDir,
        }),
      createSubdirs: () =>
        prompts.confirm({
          message:
            'Create an isolated subfolder with the name of the entity (eg: /todo) inside the parent directory?',
          initialValue: currentConfig.createSubdirs,
        }),
      httpClientImportPath: () =>
        prompts.text({
          message: 'Enter the path or alias to import httpClient:',
          placeholder: '@common/data-access',
          initialValue:
            currentConfig.httpClientImportPath || '@common/data-access',
          validate: (value) => {
            if (!value?.trim())
              return `${color.error} The import path cannot be empty${color.default}`;
          },
        }),
    },
    {
      onCancel: () => {
        prompts.cancel('Setting cancelled');
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
          message: 'Directory name for API methods:',
          placeholder: DEFAULT_CONFIG.apiDirName,
          initialValue: currentConfig.apiDirName,
        }),
      typesDirName: () =>
        prompts.text({
          message: 'Directory name for TypeScript types:',
          placeholder: DEFAULT_CONFIG.typesDirName,
          initialValue: currentConfig.typesDirName,
        }),
      hooksDirName: () =>
        prompts.text({
          message: 'Directory name for TanStack hooks:',
          placeholder: DEFAULT_CONFIG.hooksDirName,
          initialValue: currentConfig.hooksDirName,
        }),
    },
    {
      onCancel: () => {
        prompts.cancel('Setting cancelled');
        process.exit(0);
      },
    },
  );

  subdirsAnswers = names;

  const wantsLinters = await prompts.confirm({
    message:
      'Want to specify paths to ESLint/Prettier settings files for code formatting?',
    initialValue: currentConfig.customFormattersEnabled,
  });

  if (prompts.isCancel(wantsLinters)) {
    prompts.cancel('Setting cancelled');
    process.exit(0);
  }

  let prettierConfigPath: string | undefined = currentConfig.prettierConfigPath;
  let eslintConfigPath: string | undefined = currentConfig.eslintConfigPath;

  if (wantsLinters) {
    const prettierPath = await prompts.text({
      message:
        'Enter the relative path to the .prettierrc file (Enter to skip):',
      placeholder: '.prettierrc',
      initialValue: currentConfig.prettierConfigPath || '',
    });

    if (prompts.isCancel(prettierPath)) {
      prompts.cancel('Setting cancelled');
      process.exit(0);
    }

    const eslintPath = await prompts.text({
      message:
        'Enter the relative path to the ESLint configuration file (Enter to skip):',
      placeholder: './eslint.config.js',
      initialValue: currentConfig.eslintConfigPath || '',
    });

    if (prompts.isCancel(eslintPath)) {
      prompts.cancel('Setting cancelled');
      process.exit(0);
    }

    prettierConfigPath =
      typeof prettierPath === 'string' && prettierPath.trim()
        ? prettierPath.trim()
        : undefined;
    eslintConfigPath =
      typeof eslintPath === 'string' && eslintPath.trim()
        ? eslintPath.trim()
        : undefined;
  } else {
    prettierConfigPath = undefined;
    eslintConfigPath = undefined;
  }

  const finalConfig: CliConfig = {
    outputDir: structureAnswers.outputDir.trim(),
    createSubdirs: structureAnswers.createSubdirs,
    httpClientImportPath: structureAnswers.httpClientImportPath,
    apiDirName: subdirsAnswers.apiDirName.trim(),
    typesDirName: subdirsAnswers.typesDirName.trim(),
    hooksDirName: subdirsAnswers.hooksDirName.trim(),
    customFormattersEnabled: wantsLinters,
    prettierConfigPath,
    eslintConfigPath,
  };

  configManager.write(finalConfig);

  prompts.outro('🎉 Configuration file .tsgenrc.json saved successfully!');

  return finalConfig;
};
