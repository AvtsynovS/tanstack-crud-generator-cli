import { promises as fs } from 'fs';
import path from 'path';
import * as prompts from '@clack/prompts';

import type {
  DataProvider,
  EntityProperty,
  EntitySpecification,
} from '../../shared/index.js';
import { generateNestedTypeName, normalizeDataType } from './utils.js';

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

      const allEntityNames = Object.keys(parsed);

      if (allEntityNames.length === 0) {
        throw new Error('No data schemas were found in the JSON file');
      }

      let entitiesToProcess = allEntityNames;

      // Clack multiselect entities
      if (allEntityNames.length > 1) {
        const selectedNames = await prompts.multiselect({
          message:
            'Select the entities for which you want to generate TanStack CRUD:',
          options: allEntityNames.map((name) => ({ value: name, label: name })),
          required: true,
        });

        if (prompts.isCancel(selectedNames)) {
          prompts.cancel('Operation cancelled by user');
          process.exit(0);
        }

        entitiesToProcess = selectedNames as string[];
      }

      return entitiesToProcess.map((entityName, index) => {
        const schema = parsed[entityName];
        return this.parseSchema(entityName, schema, index);
      });
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

    let propType = normalizeDataType(prop.type);

    return {
      name: prop.name,
      type: propType,
      required: Boolean(prop.required),
      description:
        typeof prop.description === 'string' ? prop.description : undefined,
      pattern: typeof prop.pattern === 'string' ? prop.pattern : undefined,
      format: typeof prop.format === 'string' ? prop.format : undefined,
      enum: Array.isArray(prop.enum) ? prop.enum.map(String) : undefined,
      minimum: typeof prop.minimum === 'number' ? prop.minimum : undefined,
      maximum: typeof prop.maximum === 'number' ? prop.maximum : undefined,
      items:
        prop.items && typeof prop.items === 'object'
          ? {
              type: normalizeDataType(prop.items.type),
              enum: Array.isArray(prop.items.enum)
                ? prop.items.enum.map(String)
                : undefined,
            }
          : undefined,
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

    const nestedTypes: EntitySpecification[] = [];

    // nestedTypes
    if (
      typeof item.nestedTypes === 'object' &&
      item.nestedTypes !== null &&
      !Array.isArray(item.nestedTypes)
    ) {
      Object.entries(item.nestedTypes).forEach(
        ([nestedName, nestedSchema]: [string, any], nIdx) => {
          nestedTypes.push(this.parseSchema(nestedName, nestedSchema, nIdx));
        },
      );
    }

    const properties = item.properties.map((prop: any) => {
      if (
        prop.type === 'array' &&
        prop.items &&
        prop.items.type === 'object' &&
        Array.isArray(prop.items.properties)
      ) {
        const generatedTypeName = generateNestedTypeName(prop.name);
        const inlineNestedSpec = this.parseSchema(
          generatedTypeName,
          prop.items,
          nestedTypes.length,
        );
        nestedTypes.push(inlineNestedSpec);

        const modifiedProp = {
          ...prop,
          items: { ...prop.items, type: generatedTypeName },
        };
        return this.mapProperty(modifiedProp, name);
      }

      if (prop.type === 'object' && Array.isArray(prop.properties)) {
        const generatedTypeName = generateNestedTypeName(prop.name);

        const inlineNestedSpec = this.parseSchema(
          generatedTypeName,
          prop,
          nestedTypes.length,
        );
        nestedTypes.push(inlineNestedSpec);

        const modifiedProp = { ...prop, type: generatedTypeName };
        return this.mapProperty(modifiedProp, name);
      }

      return this.mapProperty(prop, name);
    });

    return {
      name,
      type: 'object',
      properties,
      nestedTypes: nestedTypes.length > 0 ? nestedTypes : undefined,
    };
  }
}
