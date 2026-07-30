import { SourceFile, VariableDeclarationKind } from "ts-morph";
import { EntitySpecification } from "../../shared/types/dataProvider.js";

/**
 * API Client Request Generation Template
 */
export function buildApi(
  file: SourceFile,
  spec: EntitySpecification,
  typesImportPath: string,
): void {
  const name = spec.name;
  const nameLower = name.toLowerCase();
  const urlPath = `/${nameLower}s`;

  file.addImportDeclaration({
    moduleSpecifier: "@common/data-access",
    namedImports: ["httpClient"],
  });

  file.addImportDeclaration({
    moduleSpecifier: typesImportPath,
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
