#!/usr/bin/env node

import { program } from "commander";
import fs from "fs";
import path from "path";
import { JSONValue } from "./types/types.js";
import { generateTsTypeFromSpec } from "./utils/jsonToTs.js";
import { EntitySpecification } from "./shared/types/dataProvider.js";

import { runPromptWizard } from "./features/prompt-wizard/promptWizard.js";
import { JsonDataProvider } from "./features/data-providers/JsonDataProvider.js";
import { AstGenerator } from "./core/ast-generator/AstGenerator.js";

interface GeneratedCode {
  api: string;
  types: string;
  interfaces: string;
  requestHooks: string;
}

const greenText = "\x1b[32m";
const redText = "\x1b[31m";
const resetText = "\x1b[0m";

const ensureDirExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const generateEntityCode = (spec: EntitySpecification): GeneratedCode => {
  const entityName = spec.name;

  const entityInterface = generateTsTypeFromSpec(spec);

  // TODO: replace with your http client
  const api = `import { httpClient } from '@common/data-access';

import {
  ${entityName}ApiClientType,
  ${entityName}RequestType,
  ${entityName}ResponseType,
} from '../types/requestTypes';

const get${entityName}s = async () => {
  const { data } = await httpClient.request<${entityName}ResponseType[]>({
    url: \`\/${entityName.toLowerCase()}s/\`,
    method: 'GET',
  });

  return data;
};

const get${entityName}ById = async (id: string) => {
  const { data } = await httpClient.request<${entityName}ResponseType>({
    url: \`\/${entityName.toLowerCase()}s/\${id}\`,
    method: 'GET',
  });

  return data;
};

const create${entityName} = async (request: ${entityName}RequestType) => {
  const { data } = await httpClient.request<${entityName}ResponseType>({
    url: \`\/${entityName.toLowerCase()}s/\`,
    data: request,
    method: 'POST',
  });

  return data;
};

const update${entityName} = async (id: string, body: ${entityName}RequestType) => {
  const { data } = await httpClient.request<${entityName}ResponseType>({
    url: \`\/${entityName.toLowerCase()}s/\${id}\`,
    data: body,
    method: 'PATCH',
  });

  return data;
};

const delete${entityName} = async (id: string) => {
  const { data } = await httpClient.request<void>({
    url: \`\/${entityName.toLowerCase()}s/\${id}\`,
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

  const crudInterfaces = `import { ${entityName}Type } from './types';

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

  const requestHooks = `import { useMutation, useQuery } from '@tanstack/react-query';

import { ${entityName.toLowerCase()}ApiClient } from '../api/${entityName.toLowerCase()}Request';
import { ${entityName}RequestType } from '../types/requestTypes';

type Update${entityName}RequestType = { id: string; request: ${entityName}RequestType };

export const useGet${entityName}s = () => {
  const queryKey = '${entityName.toLowerCase()}s';

  const {
    data: ${entityName.toLowerCase()}s,
    isSuccess: is${entityName}sSuccess,
    isLoading: is${entityName}sLoading,
    isError: is${entityName}sError,
  } = useQuery({
    queryKey: [queryKey],
    queryFn: () => ${entityName.toLowerCase()}ApiClient.get${entityName}s(),
    retry: false,
    throwOnError: false,
  });

  return { ${entityName.toLowerCase()}s, is${entityName}sSuccess, is${entityName}sLoading, is${entityName}sError };
};

export const useGet${entityName}ById = (id: string) => {
  const queryKey = '${entityName.toLowerCase()}';

  const {
    data: ${entityName.toLowerCase()},
    isSuccess: is${entityName}Success,
    isLoading: is${entityName}Loading,
    isError: is${entityName}Error,
  } = useQuery({
    queryKey: [queryKey, id],
    queryFn: () => ${entityName.toLowerCase()}ApiClient.get${entityName}ById(id),
    retry: false,
    throwOnError: false,
    enabled: !!id,
  });

  return { ${entityName.toLowerCase()}, is${entityName}Success, is${entityName}Loading, is${entityName}Error };
};

export const useCreate${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-create';

  const {
    data: ${entityName.toLowerCase()},
    mutate: onCreate${entityName},
    isSuccess: isCreate${entityName}Success,
    isPending: isCreate${entityName}Pending,
    isError: isCreate${entityName}Error,
  } = useMutation({
    mutationKey: [queryKey],
    mutationFn: (request: ${entityName}RequestType) =>
      ${entityName.toLowerCase()}ApiClient.create${entityName}(request),
    retry: false,
    throwOnError: false,
  });

  return { ${entityName.toLowerCase()}, onCreate${entityName}, isCreate${entityName}Success, isCreate${entityName}Pending, isCreate${entityName}Error };
};

export const useUpdate${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-update';

  const {
    data: ${entityName.toLowerCase()},
    mutate: onUpdate${entityName},
    isSuccess: isUpdate${entityName}Success,
    isPending: isUpdate${entityName}Pending,
    isError: isUpdate${entityName}Error,
  } = useMutation({
    mutationKey: [queryKey],
    mutationFn: ({ id, request }: Update${entityName}RequestType) =>
      ${entityName.toLowerCase()}ApiClient.update${entityName}(id, request),
    retry: false,
    throwOnError: false,
  });

  return { ${entityName.toLowerCase()}, onUpdate${entityName}, isUpdate${entityName}Success, isUpdate${entityName}Pending, isUpdate${entityName}Error };
};

export const useDelete${entityName} = () => {
  const queryKey = '${entityName.toLowerCase()}-delete';

  const {
    mutate: onDelete${entityName},
    isSuccess: isDelete${entityName}Success,
    isPending: isDelete${entityName}Pending,
    isError: isDelete${entityName}Error,
  } = useMutation({
    mutationKey: [queryKey],
    mutationFn: (id: string) => ${entityName.toLowerCase()}ApiClient.delete${entityName}(id),
    retry: false,
    throwOnError: false,
  });

  return { onDelete${entityName}, isDelete${entityName}Success, isDelete${entityName}Pending, isDelete${entityName}Error };
};
`;

  return {
    api,
    types: entityInterface,
    interfaces: crudInterfaces + apiInterfaces,
    requestHooks,
  };
};

program
  .version("1.0.0")
  .description("CLI tool to generate TanStack CRUD hooks and interfaces")
  .requiredOption("-s, --source <type>", "Path to the JSON schema file")
  .action(async (options) => {
    // Интерактивный диалог для установки конфигураций форматирования
    const formatterConfig = await runPromptWizard();

    // Временный лог при записи правил форматирования
    if (Object.keys(formatterConfig).length > 0) {
      console.log(
        `${greenText}Используются пути форматирования:${resetText}`,
        formatterConfig,
      );
    }

    const entityName = options.entityName;
    let entityJson: JSONValue;

    try {
      // Получаем структурированные данные из провайдера
      const provider = new JsonDataProvider(options.source);
      const specifications = await provider.getSpecification();

      const astGenerator = new AstGenerator();

      for (const spec of specifications) {
        console.log(`⏳ Generating files for an entity "${spec.name}"`);

        await astGenerator.generateEntity(spec);

        console.log(`${greenText}"Files generated successfully!"${resetText}`);
      }
    } catch (err) {
      console.error(`${redText}Ошибка выполнения CLI: ${err}${resetText}`);
      process.exit(1);
    }
  });

program.parse(process.argv);
