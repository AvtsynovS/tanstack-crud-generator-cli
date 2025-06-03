#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";

interface EntityProperty {
  name: string;
  type: string;
}

interface Entity {
  [key: string]: EntityProperty;
}

interface GeneratedCode {
  api: string;
  interfaces: string;
  requestHooks: string;
  indexFile: string;
}

const greenText = "\x1b[32m";
const redText = "\x1b[31m";
const resetText = "\x1b[0m";

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const isFileContainsLine = (filePath: string, line: string) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
    }

    const content = fs.readFileSync(filePath, "utf-8");
    return content.includes(line);
  } catch (error) {
    return false;
  }
};

const generateEntityCode = (
  entityName: string,
  entityProperties: Entity,
): GeneratedCode => {
  const interfaceProperties = Object.values(entityProperties)
    .map((property) => `  ${property.name}: ${property.type};`)
    .join("\n");

  const api = `import { BASE_URL, httpClient } from '@shared';

import {
  ${entityName}ApiClientType,
  ${entityName}RequestType,
  ${entityName}ResponseType,
} from '../types/${entityName.toLowerCase()}Types';

const get${entityName}s = async () => {
  const { data } = await httpClient.request<${entityName}ResponseType[]>({
    url: \`\${BASE_URL}/${entityName.toLowerCase()}s/\`,
    method: 'GET',
  });

  return data;
};

const get${entityName}ById = async (id: string) => {
  const { data } = await httpClient.request<${entityName}ResponseType>({
    url: \`\${BASE_URL}/${entityName.toLowerCase()}s/\${id}\`,
    method: 'GET',
  });

  return data;
};

const create${entityName} = async (request: ${entityName}RequestType) => {
  const { data } = await httpClient.request<${entityName}ResponseType>({
    url: \`\${BASE_URL}/${entityName.toLowerCase()}s/\`,
    data: request,
    method: 'POST',
  });

  return data;
};

const update${entityName} = async (id: string, body: ${entityName}RequestType) => {
  const { data } = await httpClient.request<${entityName}ResponseType>({
    url: \`\${BASE_URL}/${entityName.toLowerCase()}s/\${id}\`,
    data: body,
    method: 'PATCH',
  });

  return data;
};

const delete${entityName} = async (id: string) => {
  const { data } = await httpClient.request<void>({
    url: \`\${BASE_URL}/${entityName.toLowerCase()}s/\${id}\`,
    method: 'DELETE',
  });

  return data;
};

export const ${entityName.toLowerCase()}ApiClient: ${entityName}ApiClientType = {
  get${entityName}s,
  get${entityName}ById,
  create${entityName},
  update${entityName},
  delete${entityName},
};
`;

  const entityInterface = `export interface ${entityName}Type {
${interfaceProperties}
}
`;

  const crudInterfaces = `
export type ${entityName}RequestType = ${entityName}Type;

export type ${entityName}ResponseType = ${entityName}Type;
`;

  const apiInterfaces = `
export interface ${entityName}ApiClientType {
  get${entityName}s: () => Promise<${entityName}ResponseType[]>;
  get${entityName}ById: (id: string) => Promise<${entityName}ResponseType>;
  create${entityName}: (
    request: ${entityName}RequestType,
  ) => Promise<${entityName}ResponseType>;
  update${entityName}: (
    id: string,
    request: ${entityName}RequestType,
  ) => Promise<${entityName}ResponseType>;
  delete${entityName}: (id: string) => Promise<void>;
}
`;

  const requestHooks = `import { useMutation, useQuery } from 'react-query';
import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';
import { ${entityName}RequestType } from '../types/${entityName.toLowerCase()}Types';

type Update${entityName}RequestType = { id: string; request: ${entityName}RequestType };

export const useGet${entityName}s = () => {
  const queryKey = '${entityName.toLowerCase()}s';

  const {
    data: ${entityName.toLowerCase()}s,
    isSuccess: isLoaded,
    isError: isGet${entityName}sError,
    } = useQuery(
    [queryKey],
    () => ${entityName.toLowerCase()}ApiClient.get${entityName}s(),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { ${entityName.toLowerCase()}s, isLoaded, isGet${entityName}sError };
};

export const useGet${entityName}ById = (id: string) => {
  const queryKey = '${entityName.toLowerCase()}';

  const {
    data: ${entityName.toLowerCase()},
    isSuccess: isLoaded,
    isError: isGet${entityName}Error,
  } = useQuery(
    [queryKey, id],
    () => ${entityName.toLowerCase()}ApiClient.get${entityName}ById(id),
    {
      retry: false,
      useErrorBoundary: false,
      enabled: !!id,
    },
  );

  return { ${entityName.toLowerCase()}, isLoaded, isGet${entityName}Error };
};

export const useCreate${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-create';

  const {
    data: ${entityName.toLowerCase()},
    mutate: onCreate${entityName},
    isSuccess: isCreated,
    isError: isCreatedError,
  } = useMutation(
    [queryKey],
    (request: ${entityName}RequestType) =>
      ${entityName.toLowerCase()}ApiClient.create${entityName}(request),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { ${entityName.toLowerCase()}, onCreate${entityName}, isCreated, isCreatedError };
};

export const useUpdate${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-update';

  const {
    data: ${entityName.toLowerCase()},
    mutate: onUpdate${entityName},
    isSuccess: isUpdated,
    isError: isUpdateError,
  } = useMutation(
    [queryKey],
    ({ id, request }: Update${entityName}RequestType) =>
      ${entityName.toLowerCase()}ApiClient.update${entityName}(id, request),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { ${entityName.toLowerCase()}, onUpdate${entityName}, isUpdated, isUpdateError };
};

export const useDelete${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-delete';

  const {
    mutate: onDelete${entityName},
    isSuccess: isDeleted,
    isError: isDeleteError,
  } = useMutation(
    [queryKey],
    (id: string) => ${entityName.toLowerCase()}ApiClient.delete${entityName}(id),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { onDelete${entityName}, isDeleted, isDeleteError };
};
`;

  const indexFile = `export { ${entityName.toLowerCase()}ApiClient } from './api/${entityName.toLowerCase()}Request';
export * from './types/${entityName.toLowerCase()}Types';
export {
  useGet${entityName}s,
  useGet${entityName}ById,
  useCreate${entityName},
  useUpdate${entityName},
  useDelete${entityName},
} from './model/requestHooks';
`;

  return {
    api,
    interfaces: entityInterface + crudInterfaces + apiInterfaces,
    requestHooks,
    indexFile,
  };
};

program
  .version("1.0.0")
  .description("CLI tool to generate TanStack CRUD hooks and interfaces")
  .requiredOption("--entityName <type>", "Name of the entity")
  .option(
    "--entityProperties <type>",
    "Properties of the entity in JSON format",
  )
  .option(
    "--entityFile <type>",
    "Path to the JSON file containing entity properties",
  )
  .action((options) => {
    const entityName = options.entityName;
    let entityProperties: Entity = {};

    if (!options.entityFile && !options.entityProperties) {
      console.error(
        `${redText}Either --entityProperties or --entityFile must be provided.${resetText}`,
      );
      process.exit(1);
    }

    if (options.entityFile) {
      const fileContent = fs.readFileSync(options.entityFile, "utf-8");
      entityProperties = JSON.parse(fileContent);
    } else {
      entityProperties = JSON.parse(options.entityProperties);
    }

    const { api, interfaces, requestHooks, indexFile } = generateEntityCode(
      entityName,
      entityProperties,
    );

    const entityDir = path.join(process.cwd(), entityName);
    const apiDir = path.join(entityDir, "api");
    const typesDir = path.join(entityDir, "types");
    const modelDir = path.join(entityDir, "model");
    const indexFilePath = path.join(process.cwd(), `index.ts`);
    const exportLine = `export * from './${entityName}';\n`;

    ensureDirExists(entityDir);
    ensureDirExists(apiDir);
    ensureDirExists(typesDir);
    ensureDirExists(modelDir);

    if (!isFileContainsLine(indexFilePath, exportLine)) {
      fs.appendFileSync(indexFilePath, exportLine);
    }

    fs.writeFileSync(
      path.join(apiDir, `${entityName.toLowerCase()}Request.ts`),
      api,
    );
    fs.writeFileSync(
      path.join(typesDir, `${entityName.toLowerCase()}Types.ts`),
      interfaces,
    );
    fs.writeFileSync(path.join(modelDir, `requestHooks.ts`), requestHooks);
    fs.writeFileSync(path.join(entityDir, `index.ts`), indexFile);

    console.log(`${greenText}"Files generated successfully!"${resetText}`);
  });

program.parse(process.argv);
