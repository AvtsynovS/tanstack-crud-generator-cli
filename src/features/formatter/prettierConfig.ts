import prettier from 'prettier';

export const DEFAULT_PRETTIER_OPTIONS: prettier.Options = {
  parser: 'typescript',
  singleQuote: true,
  trailingComma: 'all',
  tabWidth: 2,
  semi: true,
  printWidth: 80,
  endOfLine: 'lf',
  bracketSpacing: true,
  singleAttributePerLine: false,
};
