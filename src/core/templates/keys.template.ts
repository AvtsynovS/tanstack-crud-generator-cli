import { SourceFile, VariableDeclarationKind } from 'ts-morph';

import type { EntitySpecification } from '../../shared/index.js';

/**
 * Query Keys Factory Generation Template for TanStack v5
 */
export function buildKeys(file: SourceFile, spec: EntitySpecification): void {
  const entityNameLower = spec.name.toLowerCase();

  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      { name: entityNameLower, initializer: `['${entityNameLower}'] as const` },
    ],
  });

  file.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: 'clientObjectKeys',
        initializer: `{\n  query: {\n    list: () => [...${entityNameLower}, 'list'],\n    one: (id: string) => [...${entityNameLower}, id] as const,\n  },\n}`,
      },
    ],
  });

  file.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: `${entityNameLower}QueryKeys`,
        initializer: 'clientObjectKeys.query',
      },
    ],
  });
}
