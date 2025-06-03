# Tanstack CRUD generator (cli)

Данный инструмент предназначен для ускорения процесса разработки проектов, созданных на основе [FSD Template](https://github.com/AvtsynovS/fsd_templates).
Он позволяет генерировать новые сущности проекта через командную строку.

В генерацию входит:

- Генерация api с использованием `BASE_URL` (необходимо устанавливать в ручную) и `httpClient` (предустановлен в `FSD Template`).
- Генерация типов сущности на основе переданных свойств / файла.
- Генерация TanStack hooks для CRUD операций.

### Доступные флаги:

`--entityName` - название новой сущности (обязательный).
`--entityProperties` - свойства новой сущности, указываем в виде строки (опциональный).
`--entityFile` - путь до файла сущности в формате JSON (опциональный).

> **Важно!**
> Для генерации необходимо указать одно из свойств `--entityProperties` или `--entityFile`.

### Пример использования флага `--entityProperties`:

`ts-gen --entityName User --entityProperties '{\"id\": {\"name\": \"id\", \"type\": \"string\"}, \"name\": {\"name\": \"name\", \"type\": \"string\"}, \"email\": {\"name\": \"email\", \"type\": \"string\"}}'`

### Пример использования флага `--entityFile`:

`ts-gen --entityName EntityName --entityFile path/to/entityProperties.json`
