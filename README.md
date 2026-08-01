# TanStack CRUD Generator (CLI)

A powerful, interactive command-line interface (CLI) automation tool designed to generate a complete, production-ready frontend data access and query layer. Based on a custom JSON data schema or a remote OpenAPI 3.0+ documentation endpoint, it automatically constructs strong **TypeScript types**, declarative **TanStack Query Keys factories (v5)**, **API CRUD request clients**, and fully-isolated **React Hooks**.

Every generated file is systematically processed through your local project's **ESLint Flat Config** and **Prettier** setups via an AST-based workflow using `ts-morph` to ensure the generated code perfectly complies with your workspace code style guidelines.

> ⚠️ **Important Note on OpenAPI Versions:**
> The parser architecture enforces strict schema validation. Currently, specification versions **3.0.0 – 3.1.2** are fully supported.
>
> If your backend endpoints yield an experimental schema framework matching **OpenAPI 3.2.0+**, the utility will immediately abort execution with an `Unsupported OpenAPI version` error. In such scenarios, it is highly recommended to temporarily downgrade and save the specification layout locally as an OpenAPI 3.1 JSON file or switch to the local Key-Value dictionary schema pattern.

---

## ✨ Features

- **Dual Data Source Support:** Seamlessly reads from structured local Key-Value JSON schemas or live OpenAPI 3.0+ specifications (via direct JSON/YAML URLs, Swagger UI, or Redoc documentation pages).
- **Intelligent URL Extraction:** Automatically scans standard user documentation pages to dynamically isolate and fetch raw specification file sources from assets like Redoc structures (`spec-url`, `data-url`) or Swagger's `swagger-initializer.js`.
- **Interactive Configuration Wizard:** Guided by `@clack/prompts` to set up runtime configurations, directory path mappings, custom alias imports, and provide targeted multi-select entity generation for both OpenAPI and local multi-entity JSON structures.
- **Architectural Isolation:** Generates completely isolated code files, drastically reducing merge conflict frequencies and eliminating immense, unmaintainable shared hook structures.
- **Advanced JSDoc Metadata Injection:** Maps data schema constraints (`pattern`, `format`, `minimum`, `maximum`) into descriptive JSDoc block comments directly above interface fields for in-IDE autocomplete validation hints.
- **Native Project Code Formatting:** Runs programmatic Prettier formatting and modern Flat Config ESLint operations directly in memory on the generated AST layout before flushing code changes onto disk.

---

## 📦 Requirements

- **Runtime Environment:** Node.js `>= 24.0.0` (Pure ESM).
- **Target Project Core Dependencies:**
  - `@tanstack/react-query` `>= 5.101.1`
  - `typescript` `>= 5.0.0`
  - `eslint` `>= 9.0.0` (modern Flat Config layout supported)
- **Supported API Specifications:**
  - OpenAPI `3.0.x` and `3.1.x` (OpenAPI `3.2.0+` versions and legacy Swagger `2.0` formats are currently not supported by the strict underlying validator engine).

---

## 🚀 Installation & Usage

Since this utility is strictly required during the software development phase to compile files and is completely obsolete within production bundles, it is highly recommended to install it locally as a development dependency (`devDependencies`):

```bash
# Installation into your local project workspace as a devDependency
npm install --save-dev tanstack-crud-generator-cli

# Alternatively for yarn / pnpm setups:
yarn add --dev tanstack-crud-generator-cli
pnpm add --save-dev tanstack-crud-generator-cli
```

### Running the Generator

Once successfully added to your workspace scripts, launch the compilation binary through `npx` inside your root directory path:

```bash
# Launching code generation based on an available source path
npx tsgen -s ./src/examples/schema.json

# Launching the interactive configuration wizard setup explicitly
npx tsgen -c
```

_(If you ever need to run the compilation routine as a one-time script without adding it to the workspace tree, execute: `npx tanstack-crud-generator-cli -s <source_path_or_url>`)_

---

### CLI Arguments & Flags

- `-s, --source <path|url>` — **(Required for generation)** The target data schema pipeline engine source. Accepts local file system positions or explicit remote URLs (Swagger UI / Redoc / raw JSON or YAML schema specs).
- `-c, --config` — **(Optional)** Runs the comprehensive interactive setup configuration dialog to populate or override the workspace runtime config state.

---

## ⚙️ Configuration Setup (`.tsgenrc.json`)

The first time you execute a generation script without a local config file, the CLI dynamically launches an internal questionnaire wizard to map out configuration pathways. The answers are saved in a `.tsgenrc.json` file in your root workspace path:

```json
{
  "outputDir": "./src/generated",
  "createSubdirs": true,
  "httpClientImportPath": "@common/data-access",
  "apiDirName": "api",
  "typesDirName": "types",
  "hooksDirName": "hooks",
  "customFormattersEnabled": true,
  "prettierConfigPath": ".prettierrc",
  "eslintConfigPath": "./eslint.config.js"
}
```

### Parameter Specification

- `outputDir`: Target destination folder where code structures are composed (default: `./`).
- `createSubdirs`: When set to `true`, wraps generated code layers into isolated domain folders named after the respective entities (e.g., `/src/generated/todo/*`).
- `httpClientImportPath`: Custom route location or path alias configuration used to import your preconfigured Axios/Fetch instance (`httpClient`).
- `apiDirName`, `typesDirName`, `hooksDirName`: Flexible isolated sub-directory structural names inside the entity folder (defaults: `api`, `types`, `hooks`).
- `customFormattersEnabled`: Toggles programmatic formatting workflows post-generation using local workspace tools.

---

## 🗂️ Generated Code File Architecture

Assuming a core data object configuration context named `Todo` is selected using default configuration settings (`createSubdirs: true`), the resulting output architecture populates as follows:

```text
src/generated/
└── todo/
    ├── api/
    │   └── todoRequests.ts       # Unified API client mapping CRUD request endpoints
    ├── types/
    │   ├── todoRequestTypes.ts   # Client types interface constraints & request/response contracts
    │   └── todoTypes.ts          # Root TypeScript models, nested blocks, and enums
    └── hooks/
        ├── todo.keys.ts          # Declarative TanStack Query v5 Key Factory
        ├── useCreateTodo.ts      # Query mutate hook wrapper for POST requests
        ├── useDeleteTodo.ts      # Query mutate hook wrapper for DELETE requests
        ├── useGetTodoById.ts     # Collection getter query hook filtering an individual item ID
        ├── useGetTodos.ts        # Primary collection array fetching query hook
        └── useUpdateTodo.ts      # Query mutate hook wrapper managing PATCH operations
```

---

## 📋 Schema Contract Samples

### 1. Local Key-Value Dictionary JSON Layout

You can easily structure layered data entities in a single JSON dictionary file. The setup handles advanced recursive type nesting, independent interface structures, global enumerations, and validation flags:

```json
{
  "Todo": {
    "type": "object",
    "properties": [
      { "name": "id", "type": "string", "required": true, "format": "uuid" },
      {
        "name": "count",
        "type": "number",
        "required": false,
        "minimum": 1,
        "maximum": 5
      },
      {
        "name": "title",
        "type": "string",
        "required": true,
        "pattern": "^[A-Z]"
      },
      { "name": "completed", "type": "boolean", "required": true },
      { "name": "meta", "type": "TodoMeta", "required": false },
      {
        "name": "status",
        "type": "TodoStatus",
        "required": true,
        "description": "Link to global Enum"
      },
      {
        "name": "priority",
        "type": "string",
        "required": true,
        "enum": ["low", "medium", "high"],
        "description": "Local Union"
      }
    ],
    "nestedTypes": {
      "TodoMeta": {
        "type": "object",
        "properties": [
          { "name": "createdAt", "type": "string", "required": true },
          { "name": "updatedAt", "type": "string", "required": false }
        ]
      },
      "TodoStatus": {
        "type": "string",
        "enum": ["pending", "completed", "archived"]
      }
    }
  },
  "User": {
    "type": "object",
    "properties": [
      { "name": "id", "type": "string", "required": true, "format": "uuid" },
      {
        "name": "email",
        "type": "string",
        "required": true,
        "format": "email"
      },
      { "name": "firstName", "type": "string", "required": true },
      { "name": "lastName", "type": "string", "required": false },
      { "name": "role", "type": "UserRole", "required": true }
    ],
    "nestedTypes": {
      "UserRole": {
        "type": "string",
        "enum": ["admin", "manager", "user"]
      }
    }
  }
}
```

### 2. OpenAPI 3.0+ Spec / Remote Documentation URLs

Instead of maintaining static schema configurations locally, route the pipeline source flag directly to your backend documentation dashboards. The engine automatically handles multiple formats:

```bash
# Scanning from remote live Swagger UI dashboards (parses swagger-initializer.js)
tsgen -s https://swagger.io
```

---

## 🧩 Generated Code Snippets Preview

### Core Types (`todoTypes.ts`)

```typescript
export interface TodoMetaType {
  createdAt: string;
  updatedAt?: string;
}

export enum TodoStatusType {
  pending = 'pending',
  completed = 'completed',
  archived = 'archived',
}

export interface TodoType {
  /**
   * @format uuid
   */
  id: string;
  /**
   * @minimum 1
   * @maximum 5
   */
  count?: number;
  /**
   * @pattern ^[A-Z]
   */
  title: string;
  completed: boolean;
  meta?: TodoMetaType;
  /**
   * Link to global Enum
   */
  status: TodoStatusType;
  /**
   * Local Union
   */
  priority: 'low' | 'medium' | 'high';
}
```

### Client Interfaces & Contracts (`todoRequestTypes.ts`)

```typescript
import { TodoType } from './todoTypes.js';

export type TodoRequestType = TodoType;
export type TodoResponseType = TodoType;

export interface TodoApiClientType {
  getTodos: () => Promise<TodoResponseType[]>;
  getTodoById: (id: string) => Promise<TodoResponseType>;
  createTodo: (request: TodoRequestType) => Promise<TodoResponseType>;
  updateTodo: (
    id: string,
    request: TodoRequestType,
  ) => Promise<TodoResponseType>;
  deleteTodo: (id: string) => Promise<void>;
}
```

### Client Request Client Mapping (`todoRequests.ts`)

```typescript
import { httpClient } from '@common/data-access';
import {
  TodoApiClientType,
  TodoRequestType,
  TodoResponseType,
} from '../types/todoRequestTypes.js';

const getTodos = async () => {
  const { data } = await httpClient.request<TodoResponseType[]>({
    url: '/todos/',
    method: 'GET',
  });
  return data;
};

const getTodoById = async (id: string) => {
  const { data } = await httpClient.request<TodoResponseType>({
    url: `/todos/${id}`,
    method: 'GET',
  });
  return data;
};

const createTodo = async (request: TodoRequestType) => {
  const { data } = await httpClient.request<TodoResponseType>({
    url: '/todos/',
    data: request,
    method: 'POST',
  });
  return data;
};

const updateTodo = async (id: string, body: TodoRequestType) => {
  const { data } = await httpClient.request<TodoResponseType>({
    url: `/todos/${id}`,
    data: body,
    method: 'PATCH',
  });
  return data;
};

const deleteTodo = async (id: string) => {
  const { data } = await httpClient.request<void>({
    url: `/todos/${id}`,
    method: 'DELETE',
  });
  return data;
};

export const todoApiClient: TodoApiClientType = {
  getTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};
```

### Query Keys Factory (`todo.keys.ts`)

```typescript
const todo = ['todo'] as const;

const clientObjectKeys = {
  query: {
    list: () => [...todo, 'list'],
    one: (id: string) => [...todo, id] as const,
  },
};

export const todoQueryKeys = clientObjectKeys.query;
```

### Isolated TanStack Query Collection Hook (`useGetTodos.ts`)

```typescript
import { useQuery } from '@tanstack/react-query';
import { todoQueryKeys } from './todo.keys.js';
import { todoApiClient } from '../api/todoRequests.js';

export const useGetTodos = () => {
  const {
    data: todos,
    isSuccess: isTodosSuccess,
    isLoading: isTodosLoading,
    isError: isTodosError,
  } = useQuery({
    queryKey: todoQueryKeys.list(),
    queryFn: () => todoApiClient.getTodos(),
    retry: false,
    throwOnError: false,
  });

  return { todos, isTodosSuccess, isTodosLoading, isTodosError };
};
```

---

## 🛡️ License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

According to the license terms, you are free to use, modify, and distribute this software, provided that **the original copyright notice (crediting the tool creator) and this permission notice are included in all copies or substantial portions of the software**.
