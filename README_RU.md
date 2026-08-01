# TanStack CRUD Generator (CLI)

Мощная интерактивная утилита командной строки (CLI) для автоматизации разработки, предназначенная для генерации полноценного, готового к продакшену frontend-слоя запросов и данных. На основе переданной JSON-схемы данных или удалённого эндпоинта OpenAPI 3.0+ инструмент автоматически создаёт строгие **TypeScript-типы**, декларативные фабрики **Query Keys для TanStack Query (v5)**, **клиентов API для CRUD-запросов** и полностью изолированные **React-хуки**.

Каждый сгенерированный файл систематически проходит через встроенное или локальное форматирование вашего проекта с использованием **ESLint Flat Config** и **Prettier** с помощью механизмов AST-манипуляций на базе `ts-morph`, гарантируя полное соответствие вашего кода принятым правилам стиля.

---

## ✨ Возможности

- **Поддержка двух источников данных:** Бесшовное чтение как из локальных структурированных JSON-файлов схем, так и из живых спецификаций OpenAPI 3.0+ (через прямые ссылки на JSON/YAML, либо через страницы интерфейсов Swagger UI или Redoc).
- **Умное разрешение URL:** Автоматическое сканирование страниц документации для динамического извлечения прямых ссылок на схемы из таких контейнеров, как разметка Redoc (`spec-url`, `data-url`) или конфигурационный скрипт Swagger `swagger-initializer.js`.
- **Интерактивные диалоги:** Работа на базе системы интерактивных опросов `@clack/prompts`, которая помогает настроить конфигурацию, выбрать соглашения об именовании папок, указать кастомные пути импорта и предоставляет удобный мультивыбор для генерации конкретных сущностей.
- **Архитектурная изоляция:** Генерация изолированных модулей, что предотвращает появление огромных конфликтов слияния (merge conflicts) и гигантских нечитаемых общих файлов.
- **Продвинутый маппинг метаданных в JSDoc:** Автоматический перенос валидационных ограничений схемы (`pattern`, `format`, `minimum`, `maximum`) прямо в подробные JSDoc-комментарии над свойствами интерфейсов для подсказок и автодополнения в вашей IDE.
- **Автофикс кода локальными линтерами:** Программный прогон кода через Prettier и современный Flat Config ESLint (`--fix`) выполняется непосредственно в виртуальной памяти на уровне AST-дерева перед записью файлов на диск.

> ⚠️ **Важное примечание по версиям OpenAPI:**
> Архитектура парсера использует строгую валидацию схем. На текущий момент полностью поддерживаются спецификации версий **3.0.0 – 3.1.2**.
>
> Если ваш бэкенд генерирует экспериментальную схему формата **OpenAPI 3.2.0+**, утилита прервёт выполнение с ошибкой `Unsupported OpenAPI version`. В таком случае для генерации кода рекомендуется временно сохранить спецификацию в локальный JSON-файл в формате OpenAPI 3.1 или использовать режим локального Key-Value словаря.

---

## 📦 Требования

- **Среда выполнения:** Node.js `>= 24.0.0` (Pure ESM).
- **Зависимости в целевом проекте пользователя:**
  - `@tanstack/react-query` `>= 5.101.1`
  - `typescript` `>= 5.0.0`
  - `eslint` `>= 9.0.0` (поддерживается современный Flat Config)
- **Поддерживаемые спецификации API:**
  - OpenAPI `3.0.x` и `3.1.x` (версии OpenAPI `3.2.0+` и устаревший формат Swagger `2.0` на текущем этапе не поддерживаются встроенным валидатором).

---

## 🚀 Установка и использование

Утилита необходима только на этапе разработки для генерации кода и не требуется в продакшен-сборке конечного продукта, её рекомендуется устанавливать как зависимость разработки (`devDependencies`):

```bash
# Установка в локальный проект как devDependency
npm install --save-dev tanstack-crud-generator-cli

# Альтернативно для yarn / pnpm:
yarn add --dev tanstack-crud-generator-cli
pnpm add --save-dev tanstack-crud-generator-cli
```

### Запуск генератора

После локальной установки вы можете запускать утилиту через `npx` внутри корневой папки вашего проекта:

```bash
# Запуск генерации кода на основе источника
npx tsgen -s ./src/examples/schema.json

# Принудительный запуск интерактивного мастера настройки конфигурации
npx tsgen -c
```

*(Если вы хотите запустить утилиту разово без установки в проект, вы также можете использовать команду `npx tanstack-crud-generator-cli -s <путь*к*источнику*или*url>`)*

---

### Аргументы и флаги CLI

- `-s, --source <path|url>` — **(Обязательный для генерации)** Целевой источник для пайплайна данных. Принимает пути к локальным файлам JSON или валидные удалённые URL-адреса (Swagger UI / Redoc / прямые ссылки на схемы JSON или YAML).
- `-c, --config` — **(Опциональный)** Запускает полный пошаговый опрос в терминале для создания или перезаписи файла настроек `.tsgenrc.json` в текущем рабочем пространстве.

---

## ⚙️ Файл конфигурации (`.tsgenrc.json`)

При первом запуске скрипта генерации без локального файла настроек CLI автоматически запускает интерактивный опросник для составления путей генерации. Ответы сохраняются в файле `.tsgenrc.json` в корневой директории вашего проекта:

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

### Спецификация параметров

- `outputDir`: Целевая директория, в которую будут записываться сгенерированные модули кода (по умолчанию: `./`).
- `createSubdirs`: Если установлено значение `true`, слои кода упаковываются в изолированные доменные папки, названные в честь соответствующих сущностей (например, `/src/generated/todo/*`).
- `httpClientImportPath`: Путь импорта или относительный алиас пути, используемый для импорта вашего предварительно настроенного экземпляра Axios/Fetch (`httpClient`).
- `apiDirName`, `typesDirName`, `hooksDirName`: Названия изолированных подпапок для соответствующих слоев кода внутри папки сущности (по умолчанию: `api`, `types`, `hooks`).
- `customFormattersEnabled`: Включает или выключает автоматическое форматирование кода (ESLint Flat Config + Prettier) после завершения генерации.

---

## 🗂️ Архитектура сгенерированных файлов

Предположим, что для генерации была выбрана сущность с именем `Todo` при стандартных настройках конфигурации (`createSubdirs: true`). Итоговая структура файлов будет выглядеть следующим образом:

```text
src/generated/
└── todo/
    ├── api/
    │   └── todoRequests.ts       # Единый клиент API с CRUD-методами запросов
    ├── types/
    │   ├── todoRequestTypes.ts   # Интерфейсы клиента API, контракты запросов/ответов
    │   └── todoTypes.ts          # Базовые TypeScript модели, вложенные типы и enum
    └── hooks/
        ├── todo.keys.ts          # Декларативная фабрика Query Keys для TanStack v5
        ├── useCreateTodo.ts      # Хук-мутация (mutate) для операций POST
        ├── useDeleteTodo.ts      # Хук-мутация (mutate) для операций DELETE
        ├── useGetTodoById.ts     # Хук-запрос (query) для получения сущности по ID
        ├── useGetTodos.ts        # Хук-запрос (query) для получения всей коллекции (массива)
        └── useUpdateTodo.ts      # Хук-мутация (mutate) для операций PATCH
```

---

## 📋 Примеры поддерживаемых контрактов данных

### 1. Локальный JSON-файл (формат Key-Value словаря)

Вы можете легко описывать сложные многоуровневые сущности в рамках одного JSON-файла. Генератор поддерживает рекурсивную вложенность типов, генерацию независимых интерфейсов, глобальных перечислений и валидационных флагов:

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

### 2. Спецификации OpenAPI 3.0+ / Удаленные URL документации

Вместо ручного ведения локальных конфигураций схем вы можете направить флаг источника напрямую на ваши серверные эндпоинты или интерфейсы документации. Архитектурный движок автоматически распознает и обработает различные форматы:

```bash
# Сканирование из интерфейса живого Swagger UI (парсит swagger-initializer.js)
tsgen -s https://petstore3.swagger.io/
```

---

## 🧩 Примеры сгенерированного кода

### Базовые типы (`todoTypes.ts`)

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

### Интерфейсы и контракты клиента (`todoRequestTypes.ts`)

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

### Реализация методов API (`todoRequests.ts`)

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

### Фабрика Query Keys (`todo.keys.ts`)

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

### Изолированный хук коллекции TanStack Query (`useGetTodos.ts`)

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

## 🛡️ Лицензия

Этот проект распространяется на условиях **лицензии MIT** — подробности см. в файле [LICENSE](LICENSE).

В соответствии с юридическими условиями лицензии, вы имеете право свободно использовать, изменять и распространять данное программное обеспечение при обязательном условии, что **оригинальное уведомление об авторских правах (с указанием автора инструмента) и данное уведомление о разрешении будут включены во все копии или существенные части программного обеспечения**.
