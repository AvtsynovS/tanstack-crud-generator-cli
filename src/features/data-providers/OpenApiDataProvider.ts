import SwaggerParser from '@apidevtools/swagger-parser';
import * as prompts from '@clack/prompts';

import type {
  DataProvider,
  EntitySpecification,
  EntityProperty,
} from '../../shared/index.js';

export class OpenApiDataProvider implements DataProvider {
  private source: string;

  constructor(source: string) {
    this.source = source;
  }

  async getSpecification(): Promise<EntitySpecification[]> {
    try {
      const resolvedSource = await this.extractRawSpecUrl(this.source);
      const parsedDocument = await SwaggerParser.validate(resolvedSource);
      const api = parsedDocument;

      if (!('openapi' in api)) {
        throw new Error(
          'The CLI only supports OpenAPI 3.0+ specifications. The older Swagger 2.0 format was detected',
        );
      }

      if (!api.components || !api.components.schemas) {
        throw new Error(
          'The submitted OpenAPI specification is missing components.schemas',
        );
      }

      const schemas = api.components.schemas;
      const allEntityNames = Object.keys(schemas);

      if (allEntityNames.length === 0) {
        throw new Error('No data schemas were found in components.schemas');
      }

      // Clack multiselect entities
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

      const entitiesToProcess = selectedNames as string[];
      const specifications: EntitySpecification[] = [];

      // map to EntitySpecification
      for (const name of entitiesToProcess) {
        const rawSchema = schemas[name];
        specifications.push(this.mapOpenApiSchema(name, rawSchema));
      }

      return specifications;
    } catch (error: any) {
      throw new Error(
        `[OpenApiDataProvider] OpenAPI parsing error: ${error.message}`,
      );
    }
  }

  /**
   * Method for intelligently scanning HTML, JS initializers, and fallback endpoints
   */
  private async extractRawSpecUrl(url: string) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) return url;

    const lowerUrl = url.toLowerCase();
    if (
      lowerUrl.endsWith('.json') ||
      lowerUrl.endsWith('.yaml') ||
      lowerUrl.endsWith('.yml')
    ) {
      return url;
    }

    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const urlObj = new URL(cleanUrl);

    try {
      // Checking the modern initialization file Swagger UI (swagger-initializer.js)
      const initializerUrl = `${cleanUrl}/swagger-initializer.js`;
      const initResponse = await fetch(initializerUrl);

      if (initResponse.ok) {
        const initJs = await initResponse.text();
        const foundPath = this.findUrlInText(initJs, cleanUrl, urlObj.origin);

        if (foundPath) return foundPath;
      }

      // Шаг Б: Search link to HTML
      const response = await fetch(cleanUrl);
      if (response.ok) {
        const html = await response.text();
        const foundPath = this.findUrlInText(html, cleanUrl, urlObj.origin);
        if (foundPath) return foundPath;

        // If there is no link in the HTML itself, but there is an initializer script connection
        if (html.includes('swagger-initializer.js') && !initResponse.ok) {
          const fallbackInit = await fetch(
            `${cleanUrl}/swagger-initializer.js`,
          );
          if (fallbackInit.ok) {
            const jsText = await fallbackInit.text();
            const foundPathJs = this.findUrlInText(
              jsText,
              cleanUrl,
              urlObj.origin,
            );
            if (foundPathJs) return foundPathJs;
          }
        }
      }

      // Heuristics / Fallback. If regular expressions fail, we try default endpoints
      const commonEndpoints = [
        '/api/v3/openapi.json',
        '/openapi.json',
        '/api/json',
        '/swagger.json',
        '/v3/api-docs',
        '/api/v3/api-docs',
      ];

      for (const endpoint of commonEndpoints) {
        try {
          const checkUrl = `${urlObj.origin}${endpoint}`;
          const res = await fetch(checkUrl, { method: 'HEAD' });
          if (res.ok) {
            return checkUrl;
          }
        } catch {
          continue;
        }
      }

      return url;
    } catch {
      return url;
    }
  }

  /**
   * Helper for searching URL patterns in text content (HTML/JS)
   */
  private findUrlInText(text: string, baseUrl: string, origin: string) {
    const urlRegexes = [
      /url\s*:\s*["']([^"']+\.(?:json|yaml|yml)[^"']*)["']/i,
      /spec-url\s*=\s*["']([^"']+)["']/i,
      /data-url\s*=\s*["']([^"']+)["']/i,
      /"url"\s*:\s*["']([^"']+\.(?:json|yaml|yml)[^"']*)["']/i,
    ];

    for (const regex of urlRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        const foundPath = match[1];

        if (foundPath.startsWith('/')) {
          return `${origin}${foundPath}`;
        }
        if (!foundPath.startsWith('http')) {
          return `${baseUrl}/${foundPath}`;
        }
        return foundPath;
      }
    }
    return null;
  }

  private mapOpenApiSchema(name: string, schema: any): EntitySpecification {
    const isEnum = schema.type === 'string' && Array.isArray(schema.enum);
    const type = isEnum ? 'string' : 'object';

    if (type === 'string') {
      return {
        name,
        type: 'string',
        enum: schema.enum.map(String),
      };
    }

    const properties: EntityProperty[] = [];
    const requiredFields = Array.isArray(schema.required)
      ? schema.required
      : [];

    if (schema.properties && typeof schema.properties === 'object') {
      Object.entries(schema.properties).forEach(
        ([propName, propBlock]: [string, any]) => {
          properties.push({
            name: propName,
            type: propBlock.title || propBlock.type || 'any',
            required: requiredFields.includes(propName),
            description: propBlock.description,
            pattern: propBlock.pattern,
            format: propBlock.format,
            enum: Array.isArray(propBlock.enum)
              ? propBlock.enum.map(String)
              : undefined,
            minimum:
              typeof propBlock.minimum === 'number'
                ? propBlock.minimum
                : undefined,
            maximum:
              typeof propBlock.maximum === 'number'
                ? propBlock.maximum
                : undefined,
          });
        },
      );
    }

    const nestedTypes: EntitySpecification[] = [];
    if (schema.properties) {
      Object.entries(schema.properties).forEach(
        ([propName, propBlock]: [string, any]) => {
          if (propBlock.title && (propBlock.properties || propBlock.enum)) {
            nestedTypes.push(this.mapOpenApiSchema(propBlock.title, propBlock));
          }
        },
      );
    }

    return {
      name,
      type: 'object',
      properties,
      nestedTypes: nestedTypes.length > 0 ? nestedTypes : undefined,
    };
  }
}
