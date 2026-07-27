import {
  Project,
  SourceFile,
  QuoteKind,
  IndentationText,
  VariableDeclarationKind,
} from "ts-morph";
import path from "path";
import { EntitySpecification } from "../../shared/types/dataProvider.js";

export class AstGenerator {
  private project: Project;
  private outputDir: string;

  constructor() {
    this.outputDir = process.cwd();

    this.project = new Project({
      manipulationSettings: {
        quoteKind: QuoteKind.Single,
        indentationText: IndentationText.TwoSpaces,
      },
    });
  }

  async generateEntity(spec: EntitySpecification): Promise<void> {
    const entityNameLower = spec.name.toLowerCase();

    const hooksDir = path.join(this.outputDir, "hooks");

    const typesFile = this.project.createSourceFile(
      path.join(this.outputDir, "types", "types.ts"),
      "",
      { overwrite: true },
    );

    const apiFile = this.project.createSourceFile(
      path.join(this.outputDir, "api", `${entityNameLower}Request.ts`),
      "",
      { overwrite: true },
    );

    const keysFile = this.project.createSourceFile(
      path.join(hooksDir, `${entityNameLower}.keys.ts`),
      "",
      { overwrite: true },
    );

    this.buildTypes(typesFile, spec);
    this.buildApi(apiFile, spec);
    this.buildKeys(keysFile, spec);

    this.buildSeparatedHooks(hooksDir, spec);

    // Save files to cd
    await this.project.save();
  }

  private buildTypes(file: SourceFile, spec: EntitySpecification): void {
    const propertiesStructure = spec.properties.map((prop) => ({
      name: prop.name,
      type: prop.type,
      hasQuestionToken: !prop.required,
    }));

    file.addInterface({
      name: `${spec.name}Type`,
      isExported: true,
      properties: propertiesStructure,
    });
  }

  private buildApi(file: SourceFile, spec: EntitySpecification): void {
    file.addImportDeclaration({
      moduleSpecifier: "@common/data-access",
      namedImports: ["httpClient"],
    });
  }

  private buildKeys(file: SourceFile, spec: EntitySpecification): void {
    const entityNameLower = spec.name.toLowerCase();

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: entityNameLower,
          initializer: `['${entityNameLower}'] as const`,
        },
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: "clientObjectKeys",
          initializer: `{\n  query: {\n    list: () => [...${entityNameLower}, 'list'],\n    one: (id: string) => [...${entityNameLower}, id] as const,\n  },\n}`,
        },
      ],
    });

    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `${entityNameLower}QueryKeys`,
          initializer: "clientObjectKeys.query",
        },
      ],
    });
  }

  /**
   * Generating hooks and keys in the hooks folder
   */
  private buildSeparatedHooks(
    hooksDir: string,
    spec: EntitySpecification,
  ): void {
    const name = spec.name;
    const nameLower = name.toLowerCase();

    const fileGetList = this.project.createSourceFile(
      path.join(hooksDir, `useGet${name}s.ts`),
      "",
      { overwrite: true },
    );
    fileGetList.addImportDeclaration({
      moduleSpecifier: "@tanstack/react-query",
      namedImports: ["useQuery"],
    });
    fileGetList.addImportDeclaration({
      moduleSpecifier: `./${nameLower}.keys.js`,
      namedImports: [`${nameLower}QueryKeys`],
    });
    fileGetList.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Request.js`,
      namedImports: [`${nameLower}ApiClient`],
    });

    fileGetList.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `useGet${name}s`,
          initializer: `() => {\n  const {\n    data: ${nameLower}s,\n    isSuccess: is${name}sSuccess,\n    isLoading: is${name}sLoading,\n    isError: is${name}sError,\n  } = useQuery({\n    queryKey: ${nameLower}QueryKeys.list(),\n    queryFn: () => ${nameLower}ApiClient.get${name}s(),\n    retry: false,\n    throwOnError: false,\n  });\n\n  return { ${nameLower}s, is${name}sSuccess, is${name}sLoading, is${name}sError };\n}`,
        },
      ],
    });

    const fileGetOne = this.project.createSourceFile(
      path.join(hooksDir, `useGet${name}ById.ts`),
      "",
      { overwrite: true },
    );
    fileGetOne.addImportDeclaration({
      moduleSpecifier: "@tanstack/react-query",
      namedImports: ["useQuery"],
    });
    fileGetOne.addImportDeclaration({
      moduleSpecifier: `./${nameLower}.keys.js`,
      namedImports: [`${nameLower}QueryKeys`],
    });
    fileGetOne.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Request.js`,
      namedImports: [`${nameLower}ApiClient`],
    });

    fileGetOne.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `useGet${name}ById`,
          initializer: `(id: string) => {\n  const {\n    data: ${nameLower},\n    isSuccess: is${name}Success,\n    isLoading: is${name}Loading,\n    isError: is${name}Error,\n  } = useQuery({\n    queryKey: ${nameLower}QueryKeys.one(id),\n    queryFn: () => ${nameLower}ApiClient.get${name}ById(id),\n    retry: false,\n    throwOnError: false,\n    enabled: !!id,\n  });\n\n  return { ${nameLower}, is${name}Success, is${name}Loading, is${name}Error };\n}`,
        },
      ],
    });

    const fileCreate = this.project.createSourceFile(
      path.join(hooksDir, `useCreate${name}.ts`),
      "",
      { overwrite: true },
    );
    fileCreate.addImportDeclaration({
      moduleSpecifier: "@tanstack/react-query",
      namedImports: ["useMutation"],
    });
    fileCreate.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Request.js`,
      namedImports: [`${nameLower}ApiClient`],
    });
    fileCreate.addImportDeclaration({
      moduleSpecifier: "../types/requestTypes.js",
      namedImports: [`${name}RequestType`],
    });

    fileCreate.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `useCreate${name}`,
          initializer: `() => {\n  const {\n    data: ${nameLower},\n    mutate: onCreate${name},\n    isSuccess: isCreate${name}Success,\n    isPending: isCreate${name}Pending,\n    isError: isCreate${name}Error,\n  } = useMutation({\n    mutationFn: (request: ${name}RequestType) =>\n      ${nameLower}ApiClient.create${name}(request),\n    retry: false,\n    throwOnError: false,\n  });\n\n  return { ${nameLower}, onCreate${name}, isCreate${name}Success, isCreate${name}Pending, isCreate${name}Error };\n}`,
        },
      ],
    });

    const fileUpdate = this.project.createSourceFile(
      path.join(hooksDir, `useUpdate${name}.ts`),
      "",
      { overwrite: true },
    );
    fileUpdate.addImportDeclaration({
      moduleSpecifier: "@tanstack/react-query",
      namedImports: ["useMutation"],
    });
    fileUpdate.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Request.js`,
      namedImports: [`${nameLower}ApiClient`],
    });
    fileUpdate.addImportDeclaration({
      moduleSpecifier: "../types/requestTypes.js",
      namedImports: [`${name}RequestType`],
    });

    fileUpdate.addTypeAlias({
      name: `Update${name}RequestType`,
      type: `{ id: string; request: ${name}RequestType }`,
    });
    fileUpdate.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `useUpdate${name}`,
          initializer: `() => {\n  const {\n    data: ${nameLower},\n    mutate: onUpdate${name},\n    isSuccess: isUpdate${name}Success,\n    isPending: isUpdate${name}Pending,\n    isError: isUpdate${name}Error,\n  } = useMutation({\n    mutationFn: ({ id, request }: Update${name}RequestType) =>\n      ${nameLower}ApiClient.update${name}(id, request),\n    retry: false,\n    throwOnError: false,\n  });\n\n  return { ${nameLower}, onUpdate${name}, isUpdate${name}Success, isUpdate${name}Pending, isUpdate${name}Error };\n}`,
        },
      ],
    });

    const fileDelete = this.project.createSourceFile(
      path.join(hooksDir, `useDelete${name}.ts`),
      "",
      { overwrite: true },
    );
    fileDelete.addImportDeclaration({
      moduleSpecifier: "@tanstack/react-query",
      namedImports: ["useMutation"],
    });
    fileDelete.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Request.js`,
      namedImports: [`${nameLower}ApiClient`],
    });

    fileDelete.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `useDelete${name}`,
          initializer: `() => {\n  const {\n    mutate: onDelete${name},\n    isSuccess: isDelete${name}Success,\n    isPending: isDelete${name}Pending,\n    isError: isDelete${name}Error,\n  } = useMutation({\n    mutationFn: (id: string) => ${nameLower}ApiClient.delete${name}(id),\n    retry: false,\n    throwOnError: false,\n  });\n\n  return { onDelete${name}, isDelete${name}Success, isDelete${name}Pending, isDelete${name}Error };\n}`,
        },
      ],
    });
  }
}
