import { Project, QuoteKind, IndentationText } from 'ts-morph';
import path from 'path';
import { EntitySpecification } from '../../shared/types/dataProvider.js';
import { CliConfig } from '../../features/config-manager/configManager.js';

import { buildRequestTypes, buildTypes } from '../templates/types.template.js';
import { buildApi } from '../templates/api.template.js';
import { buildKeys } from '../templates/keys.template.js';
import { buildHooks } from '../templates/hooks.template.js';

export class AstGenerator {
  private project: Project;
  private config: CliConfig;

  constructor(config: CliConfig) {
    this.config = config;

    this.project = new Project({
      manipulationSettings: {
        quoteKind: QuoteKind.Single,
        indentationText: IndentationText.TwoSpaces,
      },
    });
  }

  private getRelativeImportPath(
    fromDir: string,
    toDir: string,
    fileName: string,
  ): string {
    if (fromDir === toDir) {
      return `./${fileName}`;
    }
    let relativePath = path.relative(fromDir, path.join(toDir, fileName));
    if (!relativePath.startsWith('.') && !relativePath.startsWith('/')) {
      relativePath = `./${relativePath}`;
    }
    return relativePath.replace(/\\/g, '/');
  }

  async generateEntity(spec: EntitySpecification): Promise<void> {
    const entityNameLower = spec.name.toLowerCase();

    const baseDir = path.resolve(process.cwd(), this.config.outputDir);

    const entityRootDir = this.config.createSubdirs
      ? path.join(baseDir, entityNameLower)
      : baseDir;

    const targetTypesDir = path.join(entityRootDir, this.config.typesDirName);
    const targetApiDir = path.join(entityRootDir, this.config.apiDirName);
    const targetHooksDir = path.join(entityRootDir, this.config.hooksDirName);

    const requestTypesFile = this.project.createSourceFile(
      path.join(targetTypesDir, `${entityNameLower}RequestTypes.ts`),
      '',
      { overwrite: true },
    );

    const typesFile = this.project.createSourceFile(
      path.join(targetTypesDir, `${entityNameLower}Types.ts`),
      '',
      { overwrite: true },
    );

    const apiFile = this.project.createSourceFile(
      path.join(targetApiDir, `${entityNameLower}Requests.ts`),
      '',
      { overwrite: true },
    );

    const keysFile = this.project.createSourceFile(
      path.join(targetHooksDir, `${entityNameLower}.keys.ts`),
      '',
      { overwrite: true },
    );

    const typesImportPathFromApi = this.getRelativeImportPath(
      targetApiDir,
      targetTypesDir,
      `${entityNameLower}RequestTypes.js`,
    );

    const apiImportPathFromHooks = this.getRelativeImportPath(
      targetHooksDir,
      targetApiDir,
      `${entityNameLower}Requests.js`,
    );

    const typesImportPathFromHooks = this.getRelativeImportPath(
      targetHooksDir,
      targetTypesDir,
      `${entityNameLower}RequestTypes.js`,
    );

    buildApi(apiFile, spec, typesImportPathFromApi);
    buildKeys(keysFile, spec);
    buildRequestTypes(requestTypesFile, spec);
    buildTypes(typesFile, spec);
    buildHooks(
      targetHooksDir,
      spec,
      apiImportPathFromHooks,
      typesImportPathFromHooks,
      (filePath: string) =>
        this.project.createSourceFile(filePath, '', { overwrite: true }),
    );

    const { formatWithPrettier } = await import(
      '../../features/formatter/prettierFormatter.js'
    );

    const sourceFiles = this.project.getSourceFiles();

    for (const file of sourceFiles) {
      const rawText = file.getFullText();

      const formattedText = await formatWithPrettier(rawText, this.config);

      file.replaceWithText(formattedText);
    }

    await this.project.save();
  }
}
