/**
 * Description of an entity property
 */
export interface EntityProperty {
  name: string;
  type: string; // 'string', 'number', 'boolean', 'UserType', 'TodoType[]' ect.
  required: boolean;
  description?: string;
  pattern?: string; // regexp (string validation)
  format?: string; // Data format (date-time, uuid, email, int64)
  enum?: string[]; // Values ​​if this is a local Union
  minimum?: number; // Minimum value for numbers
  maximum?: number; // Maximum value for numbers
  items?: { type: string; enum?: string[] }; // Array<T>
}

/**
 * Generated entity specification for the AST generator
 */
export interface EntitySpecification {
  name: string; // Schema name (e.g. 'Todo' or 'TodoStatus')
  type: 'string' | 'object'; // OpenAPI types: 'object' for Interfaces, 'string' for enum
  enum?: string[]; // Array of values ​​if type === 'string' (this is a global Enum)
  properties?: EntityProperty[]; // Array of properties if type === 'object' (this is an Interface)
  nestedTypes?: EntitySpecification[]; // Nested schemas (can be objects or enums)
}

/**
 * Common interface for data providers (JSON and OpenAPI)
 */
export interface DataProvider {
  getSpecification(): Promise<EntitySpecification[]>;
}
