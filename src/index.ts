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
  interfaces: string;
  hooks: string;
}

function generateEntityCode(
  entityName: string,
  entityProperties: Entity,
): GeneratedCode {
  const interfaceProperties = Object.values(entityProperties)
    .map((property) => `  ${property.name}: ${property.type};`)
    .join("\n");

  const entityInterface = `
interface ${entityName} {
${interfaceProperties}
}
`;

  const crudInterfaces = `
interface Create${entityName}Input {
${interfaceProperties}
}

interface Update${entityName}Input {
${interfaceProperties}
}

interface ${entityName}Response {
  data: ${entityName};
}
`;

  const hooks = `
import { useMutation, useQuery, useQueryClient } from 'react-query';
import axios from 'axios';

// Хук для получения списка сущностей
export const use${entityName}s = () => {
  return useQuery<${entityName}[], Error>({
    queryKey: ['${entityName.toLowerCase()}s'],
    queryFn: async () => {
      const response = await axios.get<${entityName}[]>('/api/${entityName.toLowerCase()}s');
      return response.data;
    },
  });
};

// Хук для получения одной сущности
export const use${entityName} = (id: string) => {
  return useQuery<${entityName}, Error>({
    queryKey: ['${entityName.toLowerCase()}', id],
    queryFn: async () => {
      const response = await axios.get<${entityName}>(/api/${entityName.toLowerCase()}/\${id});
      return response.data;
    },
  });
};

// Хук для создания сущности
export const useCreate${entityName} = () => {
  const queryClient = useQueryClient();
  return useMutation<${entityName}, Error, Create${entityName}Input>({
    mutationFn: async (input) => {
      const response = await axios.post<${entityName}>(/api/${entityName.toLowerCase()}s, input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['${entityName.toLowerCase()}s']);
    },
  });
};

// Хук для обновления сущности
export const useUpdate${entityName} = () => {
  const queryClient = useQueryClient();
  return useMutation<${entityName}, Error, Update${entityName}Input>({
    mutationFn: async (input) => {
      const response = await axios.put<${entityName}>(/api/${entityName.toLowerCase()}/\${input.id}, input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['${entityName.toLowerCase()}s']);
    },
  });
};

// Хук для удаления сущности
export const useDelete${entityName} = () => {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      await axios.delete(/api/${entityName.toLowerCase()}/\${id});
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['${entityName.toLowerCase()}s']);
    },
  });
};
`;

  return {
    interfaces: entityInterface + crudInterfaces,
    hooks: hooks,
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

    const typesDir = path.join(process.cwd(), "types");
    const modelDir = path.join(process.cwd(), "model");

    if (!fs.existsSync(typesDir)) {
      fs.mkdirSync(typesDir);
    }

    if (!fs.existsSync(modelDir)) {
      fs.mkdirSync(modelDir);
    }

    fs.writeFileSync(
      path.join(typesDir, `${entityName.toLowerCase()}Types.ts`),
      generatedCode.interfaces,
    );
    fs.writeFileSync(
      path.join(modelDir, `use${entityName}Hooks.ts`),
      generatedCode.hooks,
    );

    console.log("Files generated successfully!");
  });

program.parse(process.argv);
