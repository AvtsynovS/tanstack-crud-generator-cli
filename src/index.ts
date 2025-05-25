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
  [key: string]: string;
}

function generateEntityCode(
  entityName: string,
  entityProperties: Entity,
): GeneratedCode {
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

  const getEntities = `import { useQuery } from 'react-query';
import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';

export const useGet${entityName}s = () => {
  const queryKey = '${entityName.toLowerCase()}s';

  const { data: ${entityName.toLowerCase()}s, isSuccess: isLoaded } = useQuery(
    [queryKey],
    () => ${entityName.toLowerCase()}ApiClient.get${entityName}s(),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { ${entityName.toLowerCase()}s, isLoaded };
};
`;

  const getEntityById = `import { useQuery } from 'react-query';
import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';

export const useGet${entityName}ById = (id: string) => {
  const queryKey = '${entityName.toLowerCase()}';

  const {
    data: ${entityName.toLowerCase()},
    isSuccess: isLoaded,
  } = useQuery(
    [queryKey, id],
    () => ${entityName.toLowerCase()}ApiClient.get${entityName}ById(id),
    {
      retry: false,
      useErrorBoundary: false,
      enabled: !!id,
    },
  );

  return { ${entityName.toLowerCase()}, isLoaded };
};
`;

  const createEntity = `import { useMutation } from 'react-query';
import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';
import { ${entityName}RequestType } from '../types/${entityName.toLowerCase()}Types';

export const useCreate${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-create';

  const {
    data: ${entityName.toLowerCase()},
    mutate: onCreate${entityName},
    isSuccess: isCreated,
  } = useMutation(
    [queryKey],
    (request: ${entityName}RequestType) =>
      ${entityName.toLowerCase()}ApiClient.create${entityName}(request),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { ${entityName.toLowerCase()}, isCreated, onCreate${entityName} };
};
`;

  const updateEntity = `import { useMutation } from 'react-query';
import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';
import { ${entityName}RequestType } from '../types/${entityName.toLowerCase()}Types';

type Update${entityName}RequestType = { id: string; request: ${entityName}RequestType };

export const useUpdate${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-update';

  const {
    data: ${entityName.toLowerCase()},
    mutate: onUpdate${entityName},
    isSuccess: isUpdated,
  } = useMutation(
    [queryKey],
    ({ id, request }: Update${entityName}RequestType) =>
      ${entityName.toLowerCase()}ApiClient.update${entityName}(id, request),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { ${entityName.toLowerCase()}, isUpdated, onUpdate${entityName} };
};
`;

  const deleteEntity = `import { useMutation } from 'react-query';
import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';

export const useDelete${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-delete';

  const {
    mutate: onDelete${entityName},
    isSuccess: isDeleted,
  } = useMutation(
    [queryKey],
    (id: string) => ${entityName.toLowerCase()}ApiClient.delete${entityName}(id),
    {
      retry: false,
      useErrorBoundary: false,
    },
  );

  return { onDelete${entityName}, isDeleted };
};
`;

  // TODO добавить возможность подгружать файл для генерации кода
  return {
    api: api,
    interfaces: entityInterface + crudInterfaces + apiInterfaces,
    [`useGet${entityName}s`]: getEntities,
    [`useGet${entityName}ById`]: getEntityById,
    [`useCreate${entityName}`]: createEntity,
    [`useUpdate${entityName}`]: updateEntity,
    [`useDelete${entityName}`]: deleteEntity,
  };
}

program
  .version("1.0.0")
  .description("CLI tool to generate TanStack CRUD hooks and interfaces")
  .requiredOption("--entityName <type>", "Name of the entity")
  .requiredOption(
    "--entityProperties <type>",
    "Properties of the entity in JSON format",
  )
  .action((options) => {
    const entityName = options.entityName;
    const entityProperties: Entity = JSON.parse(options.entityProperties);

    const generatedCode = generateEntityCode(entityName, entityProperties);

    const apiDir = path.join(process.cwd(), "api");
    const typesDir = path.join(process.cwd(), "types");
    const modelDir = path.join(process.cwd(), "model");

    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir);
    }

    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir);
    }

    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir);
    }

    fs.writeFileSync(
      path.join(apiDir, `${entityName.toLowerCase()}Request.ts`),
      generatedCode.api,
    );
    fs.writeFileSync(
      path.join(typesDir, `${entityName.toLowerCase()}Types.ts`),
      generatedCode.interfaces,
    );
    fs.writeFileSync(
      path.join(modelDir, `useGet${entityName}s.ts`),
      generatedCode[`useGet${entityName}s`],
    );
    fs.writeFileSync(
      path.join(modelDir, `useGet${entityName}ById.ts`),
      generatedCode[`useGet${entityName}ById`],
    );
    fs.writeFileSync(
      path.join(modelDir, `useCreate${entityName}.ts`),
      generatedCode[`useCreate${entityName}`],
    );
    fs.writeFileSync(
      path.join(modelDir, `useUpdate${entityName}.ts`),
      generatedCode[`useUpdate${entityName}`],
    );
    fs.writeFileSync(
      path.join(modelDir, `useDelete${entityName}.ts`),
      generatedCode[`useDelete${entityName}`],
    );

    console.log("Files generated successfully!");
  });

program.parse(process.argv);
