import { SourceFile, VariableDeclarationKind } from "ts-morph";
import path from "path";
import { EntitySpecification } from "../../shared/types/dataProvider.js";

/**
 * TanStack CRUD React Hooks Generation Template
 */
export function buildHooks(
  hooksDir: string,
  spec: EntitySpecification,
  apiImportPath: string,
  typesImportPath: string,
  createSourceFileFn: (filePath: string) => SourceFile,
): void {
  const name = spec.name;
  const nameLower = name.toLowerCase();

  const fileGetList = createSourceFileFn(
    path.join(hooksDir, `useGet${name}s.ts`),
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
    moduleSpecifier: apiImportPath,
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

  const fileGetOne = createSourceFileFn(
    path.join(hooksDir, `useGet${name}ById.ts`),
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
    moduleSpecifier: apiImportPath,
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

  const fileCreate = createSourceFileFn(
    path.join(hooksDir, `useCreate${name}.ts`),
  );
  fileCreate.addImportDeclaration({
    moduleSpecifier: "@tanstack/react-query",
    namedImports: ["useMutation"],
  });
  fileCreate.addImportDeclaration({
    moduleSpecifier: apiImportPath,
    namedImports: [`${nameLower}ApiClient`],
  });
  fileCreate.addImportDeclaration({
    moduleSpecifier: typesImportPath,
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

  const fileUpdate = createSourceFileFn(
    path.join(hooksDir, `useUpdate${name}.ts`),
  );
  fileUpdate.addImportDeclaration({
    moduleSpecifier: "@tanstack/react-query",
    namedImports: ["useMutation"],
  });
  fileUpdate.addImportDeclaration({
    moduleSpecifier: apiImportPath,
    namedImports: [`${nameLower}ApiClient`],
  });
  fileUpdate.addImportDeclaration({
    moduleSpecifier: typesImportPath,
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

  const fileDelete = createSourceFileFn(
    path.join(hooksDir, `useDelete${name}.ts`),
  );
  fileDelete.addImportDeclaration({
    moduleSpecifier: "@tanstack/react-query",
    namedImports: ["useMutation"],
  });
  fileDelete.addImportDeclaration({
    moduleSpecifier: apiImportPath,
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
