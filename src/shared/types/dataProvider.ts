/**
 * Описание свойства сущности
 */
export interface EntityProperty {
  name: string;
  type: string; // 'string', 'number', 'boolean', 'UserType', 'TodoType[]' и т.д.
  required: boolean;
  description?: string;
  pattern?: string; // Регулярное выражение (валидация строк)
  format?: string; // Формат данных (date-time, uuid, email, int64)
  enum?: string[]; // Значения, если это локальный Union
  minimum?: number; // Минимальное значение для чисел
  maximum?: number; // Максимальное значение для чисел
}

/**
 * Спецификация сгенерированной сущности для AST-генератора
 */
export interface EntitySpecification {
  name: string; // Имя схемы (например, 'Todo' или 'TodoStatus')
  type: "string" | "object"; // OpenAPI типы: 'object' для интерфейсов, 'string' для enum
  enum?: string[]; // Массив значений, если type === 'string' (это глобальный Enum)
  properties?: EntityProperty[]; // Массив свойств, если type === 'object' (это интерфейс)
  nestedTypes?: EntitySpecification[]; // Вложенные схемы (тоже могут быть объектами или enum)
}

/**
 * Общий интерфейс для провайдеров данных (JSON и OpenAPI)
 */
export interface DataProvider {
  getSpecification(): Promise<EntitySpecification[]>;
}
