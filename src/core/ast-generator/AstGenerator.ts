import {
  Project,
  SourceFile,
  QuoteKind,
  IndentationText,
  VariableDeclarationKind,
} from "ts-morph";
import path from "path";
import {
  EntityProperty,
  EntitySpecification,
} from "../../shared/types/dataProvider.js";

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

    const requestTypesFile = this.project.createSourceFile(
      path.join(this.outputDir, "types", "requestTypes.ts"),
      "",
      { overwrite: true },
    );

    const typesFile = this.project.createSourceFile(
      path.join(this.outputDir, "types", "types.ts"),
      "",
      { overwrite: true },
    );

    const apiFile = this.project.createSourceFile(
      path.join(this.outputDir, "api", `${entityNameLower}Requests.ts`),
      "",
      { overwrite: true },
    );

    const keysFile = this.project.createSourceFile(
      path.join(hooksDir, `${entityNameLower}.keys.ts`),
      "",
      { overwrite: true },
    );

    this.buildRequestTypes(requestTypesFile, spec);
    this.buildTypes(typesFile, spec);
    this.buildApi(apiFile, spec);
    this.buildKeys(keysFile, spec);
    this.buildHooks(hooksDir, spec);

    // Save files to cd
    await this.project.save();
  }

  /**
   * Generating requestTypes in the types folder
   */
  private buildRequestTypes(file: SourceFile, spec: EntitySpecification): void {
    const name = spec.name;

    file.addImportDeclaration({
      moduleSpecifier: "./types.js",
      namedImports: [`${name}Type`],
    });

    file.addTypeAlias({
      name: `${name}RequestType`,
      type: `${name}Type`,
      isExported: true,
    });

    file.addTypeAlias({
      name: `${name}ResponseType`,
      type: `${name}Type`,
      isExported: true,
    });

    file.addInterface({
      name: `${name}ApiClientType`,
      isExported: true,
      properties: [
        {
          name: `get${name}s`,
          type: `() => Promise<${name}ResponseType[]>`,
        },
        {
          name: `get${name}ById`,
          type: `(id: string) => Promise<${name}ResponseType>`,
        },
        {
          name: `create${name}`,
          type: `(request: ${name}RequestType) => Promise<${name}ResponseType>`,
        },
        {
          name: `update${name}`,
          type: `(id: string, request: ${name}RequestType) => Promise<${name}ResponseType>`,
        },
        {
          name: `delete${name}`,
          type: `(id: string) => Promise<void>`,
        },
      ],
    });
  }

  /**
   * Generating types in the types folder
   */
  private buildTypes(file: SourceFile, spec: EntitySpecification): void {
    const customTypeNames = new Set<string>();

    const collectTypeNames = (schema: EntitySpecification) => {
      customTypeNames.add(schema.name);
      if (schema.nestedTypes && Array.isArray(schema.nestedTypes)) {
        schema.nestedTypes.forEach(collectTypeNames);
      }
    };

    collectTypeNames(spec);

    const buildJsDocLines = (prop: EntityProperty): string[] => {
      const docs: string[] = [];

      if (prop.description) {
        docs.push(prop.description);
      }
      if (prop.format) {
        docs.push(`@format ${prop.format}`);
      }
      if (prop.pattern) {
        docs.push(`@pattern ${prop.pattern}`);
      }
      if (prop.minimum !== undefined) {
        docs.push(`@minimum ${prop.minimum}`);
      }
      if (prop.maximum !== undefined) {
        docs.push(`@maximum ${prop.maximum}`);
      }

      return docs;
    };

    const processSchema = (schema: EntitySpecification) => {
      // Global Enum
      if (schema.type === "string" && Array.isArray(schema.enum)) {
        file.addEnum({
          name: `${schema.name}Type`,
          isExported: true,
          members: schema.enum.map((value) => ({
            name: value,
            value: value,
          })),
        });
        return;
      }

      if (schema.nestedTypes && Array.isArray(schema.nestedTypes)) {
        schema.nestedTypes.forEach((nestedSchema) =>
          processSchema(nestedSchema),
        );
      }

      if (schema.type === "object" && Array.isArray(schema.properties)) {
        const propertiesStructure = schema.properties.map((prop) => {
          let propType = prop.type;

          // Local Union
          if (prop.type === "string" && Array.isArray(prop.enum)) {
            propType = prop.enum.map((val) => `'${val}'`).join(" | ");
          } else if (customTypeNames.has(prop.type)) {
            propType = `${prop.type}Type`;
          }

          const jsDocLines = buildJsDocLines(prop);

          return {
            name: prop.name,
            type: propType,
            hasQuestionToken: !prop.required,
            docs: jsDocLines.length > 0 ? [jsDocLines.join("\n")] : undefined,
          };
        });

        file.addInterface({
          name: `${schema.name}Type`,
          isExported: true,
          properties: propertiesStructure,
        });
      }
    };

    processSchema(spec);
  }

  /**
   * Generating API-client in the api folder
   */
  private buildApi(file: SourceFile, spec: EntitySpecification): void {
    const name = spec.name;
    const nameLower = name.toLowerCase();
    const urlPath = `/${nameLower}s`;

    file.addImportDeclaration({
      moduleSpecifier: "@common/data-access",
      namedImports: ["httpClient"],
    });

    file.addImportDeclaration({
      moduleSpecifier: "../types/requestTypes.js",
      namedImports: [
        `${name}ApiClientType`,
        `${name}RequestType`,
        `${name}ResponseType`,
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `get${name}s`,
          initializer: `async () => {\n  const { data } = await httpClient.request<${name}ResponseType[]>({ \n    url: \`${urlPath}/\`,\n    method: 'GET',\n  });\n  return data;\n}`,
        },
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `get${name}ById`,
          initializer: `async (id: string) => {\n  const { data } = await httpClient.request<${name}ResponseType>({ \n    url: \`${urlPath}/\${id}\`,\n    method: 'GET',\n  });\n  return data;\n}`,
        },
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `create${name}`,
          initializer: `async (request: ${name}RequestType) => {\n  const { data } = await httpClient.request<${name}ResponseType>({ \n    url: \`${urlPath}/\`,\n    data: request,\n    method: 'POST',\n  });\n  return data;\n}`,
        },
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `update${name}`,
          initializer: `async (id: string, body: ${name}RequestType) => {\n  const { data } = await httpClient.request<${name}ResponseType>({ \n    url: \`${urlPath}/\${id}\`,\n    data: body,\n    method: 'PATCH',\n  });\n  return data;\n}`,
        },
      ],
    });

    file.addVariableStatement({
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `delete${name}`,
          initializer: `async (id: string) => {\n  const { data } = await httpClient.request<void>({ \n    url: \`${urlPath}/\${id}\`,\n    method: 'DELETE',\n  });\n  return data;\n}`,
        },
      ],
    });

    file.addVariableStatement({
      isExported: true,
      declarationKind: VariableDeclarationKind.Const,
      declarations: [
        {
          name: `${nameLower}ApiClient`,
          type: `${name}ApiClientType`,
          initializer: `{\n  get${name}s,\n  get${name}ById,\n  create${name},\n  update${name},\n  delete${name},\n}`,
        },
      ],
    });
  }

  /**
   * Generating keys in the hooks folder
   */
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
   * Generating hooks in the hooks folder
   */
  private buildHooks(hooksDir: string, spec: EntitySpecification): void {
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
      moduleSpecifier: `./${nameLower}.keys.ts`,
      namedImports: [`${nameLower}QueryKeys`],
    });
    fileGetList.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Requests.ts`,
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
      moduleSpecifier: `./${nameLower}.keys.ts`,
      namedImports: [`${nameLower}QueryKeys`],
    });
    fileGetOne.addImportDeclaration({
      moduleSpecifier: `../api/${nameLower}Requests.ts`,
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
      moduleSpecifier: `../api/${nameLower}Requests.ts`,
      namedImports: [`${nameLower}ApiClient`],
    });
    fileCreate.addImportDeclaration({
      moduleSpecifier: "../types/requestTypes.ts",
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
      moduleSpecifier: `../api/${nameLower}Requests.ts`,
      namedImports: [`${nameLower}ApiClient`],
    });
    fileUpdate.addImportDeclaration({
      moduleSpecifier: "../types/requestTypes.ts",
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
      moduleSpecifier: `../api/${nameLower}Requests.ts`,
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
