import { Project, QuoteKind, IndentationText } from 'ts-morph';
import path from 'path';
import {
  buildApi,
  buildHooks,
  buildKeys,
  buildRequestTypes,
  buildTypes,
} from '../templates/index.js';

import type { CliConfig, EntitySpecification } from '../../shared/index.js';

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

    buildApi({
      file: apiFile,
      spec,
      typesImportPath: typesImportPathFromApi,
      httpClientImportPath: this.config.httpClientImportPath,
    });
    buildKeys(keysFile, spec);
    buildRequestTypes(requestTypesFile, spec);
    buildTypes(typesFile, spec);
    buildHooks({
      hooksDir: targetHooksDir,
      spec,
      apiImportPath: apiImportPathFromHooks,
      typesImportPath: typesImportPathFromHooks,
      createSourceFileFn: (filePath: string) =>
        this.project.createSourceFile(filePath, '', { overwrite: true }),
    });

    const { formatWithPrettier } = await import(
      '../../features/formatter/prettierFormatter.js'
    );
    const { formatWithEslint } = await import(
      '../../features/formatter/eslintFormatter.js'
    );

    const sourceFiles = this.project.getSourceFiles();

    for (const file of sourceFiles) {
      const filePath = file.getFilePath();
      const rawText = file.getFullText();

      const prettierFormattedText = await formatWithPrettier(
        rawText,
        this.config,
      );

      const eslintFixedText = await formatWithEslint(
        prettierFormattedText,
        filePath,
        this.config,
      );

      file.replaceWithText(eslintFixedText);
    }

    await this.project.save();
  }
}
