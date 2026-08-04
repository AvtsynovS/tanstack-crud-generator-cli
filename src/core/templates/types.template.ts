import { SourceFile } from 'ts-morph';

import type {
  EntityProperty,
  EntitySpecification,
} from '../../shared/index.js';

/**
 * Request/Response type and client interface generation template
 */
export function buildRequestTypes(
  file: SourceFile,
  spec: EntitySpecification,
): void {
  const name = spec.name;
  const entityNameLower = name.toLowerCase();

  file.addImportDeclaration({
    moduleSpecifier: `./${entityNameLower}Types.js`,
    namedImports: [`${name}Type`],
    isTypeOnly: true,
  });

  file.addTypeAlias({
    name: `${name}RequestType`,
    type: `${name}Type`,
    isExported: true,
  });

  file.addTypeAlias({
    name: `${name}ResponseType`,
    type: `${name}Type`,
    isExported: true,
  });

  file.addInterface({
    name: `${name}ApiClientType`,
    isExported: true,
    properties: [
      { name: `get${name}s`, type: `() => Promise<${name}ResponseType[]>` },
      {
        name: `get${name}ById`,
        type: `(id: string) => Promise<${name}ResponseType>`,
      },
      {
        name: `create${name}`,
        type: `(request: ${name}RequestType) => Promise<${name}ResponseType>`,
      },
      {
        name: `update${name}`,
        type: `(id: string, request: ${name}RequestType) => Promise<${name}ResponseType>`,
      },
      { name: `delete${name}`, type: `(id: string) => Promise<void>` },
    ],
  });
}

/**
 * Generating template for basic interfaces and entity enums
 */
export function buildTypes(file: SourceFile, spec: EntitySpecification): void {
  const customTypeNames = new Set<string>();

  const collectTypeNames = (schema: EntitySpecification) => {
    customTypeNames.add(schema.name);
    if (schema.nestedTypes && Array.isArray(schema.nestedTypes)) {
      schema.nestedTypes.forEach(collectTypeNames);
    }
  };

  collectTypeNames(spec);

  const buildJsDocLines = (prop: EntityProperty): string[] => {
    const docs: string[] = [];
    if (prop.description) docs.push(prop.description);
    if (prop.format) docs.push(`@format ${prop.format}`);
    if (prop.pattern) docs.push(`@pattern ${prop.pattern}`);
    if (prop.minimum !== undefined) docs.push(`@minimum ${prop.minimum}`);
    if (prop.maximum !== undefined) docs.push(`@maximum ${prop.maximum}`);
    return docs;
  };

  const resolvePropertyType = (prop: EntityProperty): string => {
    if (!prop) return 'any';

    if (prop.type === 'array' && prop.items) {
      const itemType = resolvePropertyType({
        name: prop.name,
        type: prop.items.type,
        required: true,
        enum: prop.items.enum,
      });

      return itemType.includes('|') ? `(${itemType})[]` : `${itemType}[]`;
    }

    // Local Union
    if (prop.type === 'string' && Array.isArray(prop.enum)) {
      return prop.enum.map((val) => `'${val}'`).join(' | ');
    }

    // Interface
    if (customTypeNames.has(prop.type)) {
      return `${prop.type}Type`;
    }

    return prop.type;
  };

  const processSchema = (schema: EntitySpecification) => {
    if (schema.type === 'string' && Array.isArray(schema.enum)) {
      file.addEnum({
        name: `${schema.name}Type`,
        isExported: true,
        members: schema.enum.map((value) => ({ name: value, value: value })),
      });
      return;
    }

    if (schema.nestedTypes && Array.isArray(schema.nestedTypes)) {
      schema.nestedTypes.forEach((nestedSchema) => processSchema(nestedSchema));
    }

    if (schema.type === 'object' && Array.isArray(schema.properties)) {
      const propertiesStructure = schema.properties.map((prop) => {
        const propType = resolvePropertyType(prop);
        const jsDocLines = buildJsDocLines(prop);

        return {
          name: prop.name,
          type: propType,
          hasQuestionToken: !prop.required,
          docs: jsDocLines.length > 0 ? [jsDocLines.join('\n')] : undefined,
        };
      });

      file.addInterface({
        name: `${schema.name}Type`,
        isExported: true,
        properties: propertiesStructure,
      });
    }
  };

  processSchema(spec);
}
