import { promises as fs } from 'fs';
import path from 'path';
import {
  DataProvider,
  EntitySpecification,
  EntityProperty,
} from '../../shared/types/dataProvider.js';

export class JsonDataProvider implements DataProvider {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  async getSpecification(): Promise<EntitySpecification[]> {
    try {
      const rawData = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(rawData);

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        throw new Error(
          'Root of the JSON file must be a Key-Value object (dictionary of entities)',
        );
      }

      return Object.entries(parsed).map(
        ([entityName, schema]: [string, any], index) => {
          return this.parseSchema(entityName, schema, index);
        },
      );
    } catch (error: any) {
      throw new Error(
        `[JsonDataProvider] Failed to parse JSON file: ${error.message}`,
      );
    }
  }

  private mapProperty(prop: any, contextName: string): EntityProperty {
    if (!prop.name || typeof prop.name !== 'string') {
      throw new Error(
        `Property name missing or invalid in context "${contextName}".`,
      );
    }
    if (!prop.type || typeof prop.type !== 'string') {
      throw new Error(
        `Property type missing or invalid for "${prop.name}" in context "${contextName}".`,
      );
    }

    return {
      name: prop.name,
      type: prop.type,
      required: Boolean(prop.required),
      description:
        typeof prop.description === 'string' ? prop.description : undefined,
      pattern: typeof prop.pattern === 'string' ? prop.pattern : undefined,
      format: typeof prop.format === 'string' ? prop.format : undefined,
      enum: Array.isArray(prop.enum) ? prop.enum.map(String) : undefined,
      minimum: typeof prop.minimum === 'number' ? prop.minimum : undefined,
      maximum: typeof prop.maximum === 'number' ? prop.maximum : undefined,
    };
  }

  private parseSchema(
    name: string,
    item: any,
    index: number,
  ): EntitySpecification {
    if (!name || typeof name !== 'string') {
      throw new Error(`Invalid schema name at index ${index}`);
    }
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Schema definition for "${name}" must be an object`);
    }

    const type = item.type === 'string' ? 'string' : 'object';

    // Global Enum
    if (type === 'string') {
      if (!Array.isArray(item.enum)) {
        throw new Error(
          `Enum schema "${name}" must have an "enum" array of strings`,
        );
      }
      return {
        name,
        type: 'string',
        enum: item.enum.map(String),
      };
    }

    // Interface
    if (!Array.isArray(item.properties)) {
      throw new Error(`Object schema "${name}" must have a "properties" array`);
    }

    const properties = item.properties.map((prop: any) =>
      this.mapProperty(prop, name),
    );

    let nestedTypes: EntitySpecification[] | undefined;

    if (
      typeof item.nestedTypes === 'object' &&
      item.nestedTypes !== null &&
      !Array.isArray(item.nestedTypes)
    ) {
      nestedTypes = Object.entries(item.nestedTypes).map(
        ([nestedName, nestedSchema]: [string, any], nIdx) =>
          this.parseSchema(nestedName, nestedSchema, nIdx),
      );
    }

    return {
      name,
      type: 'object',
      properties,
      nestedTypes,
    };
  }
}
