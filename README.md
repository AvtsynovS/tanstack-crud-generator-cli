# Tanstack CRUD generator (cli)

Данный инструмент предназначен для ускорения процесса разработки проектов, с применением библиотеки [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview).
Он позволяет генерировать новые сущности проекта через командную строку.

В генерацию входит:

- Генерация api с использованием `httpClient`. Можно использовать из проекта [FSD Template](https://github.com/AvtsynovS/fsd_templates/blob/main/src/shared/api/httpClient.ts) или предоставить свой.
- Генерация типов сущности на основе предоставленного JSON-файла.
- Генерация TanStack hooks для CRUD операций.

### Доступные флаги:

`--entityName` - название новой сущности (обязательный).
`--entityFile` - путь до файла сущности в формате JSON (обязательный).

> **Важно!**
> Для генерации необходимо обязательно указать `--entityName` и `--entityFile`.

### Пример использования флага `--entityFile`:

`ts-gen --entityName EntityName --entityFile path/to/entityProperties.json`
