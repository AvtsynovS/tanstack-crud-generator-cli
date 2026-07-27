/**
 * Описание свойства сущности
 */
export interface EntityProperty {
  name: string;
  type: string; // 'string', 'number', 'boolean', 'UserType', 'TodoType[]' и т.д.
  required: boolean;
  description?: string;
}

/**
 * Спецификация сгенерированной сущности для AST-генератора
 */
export interface EntitySpecification {
  name: string; // Например, 'Todo'
  properties: EntityProperty[];
  nestedTypes?: Array<{
    name: string;
    properties: EntityProperty[];
  }>;
}

/**
 * Общий интерфейс для провайдеров данных (JSON и OpenAPI)
 */
export interface DataProvider {
  getSpecification(): Promise<EntitySpecification[]>;
}
