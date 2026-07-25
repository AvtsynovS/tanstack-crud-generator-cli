import { JSONValue } from "../types/types.js";

const capitalize = (name: string) =>
  name.charAt(0).toUpperCase() + name.slice(1);

export const generateTsTypeFromJson = (
  obj: JSONValue,
  rootName: string,
): string => {
  const typeDefs: string[] = [];

  const parseValue = (
    value: JSONValue,
    propName?: string,
    parentName?: string,
  ): string => {
    // Primitive or union
    if (typeof value === "string") {
      // Check array, example: ["string"]
      const arrayMatch = value.match(/^\[\s*["']?(.+?)["']?\s*\]$/);
      if (arrayMatch) return `${arrayMatch[1]}[]`;

      return value
        .split("|")
        .map((p) => p.trim())
        .join(" | ");
    }

    // Array
    if (Array.isArray(value)) {
      if (value.length === 0) return "any[]";
      const first = value[0];

      if (
        typeof first === "object" &&
        first !== null &&
        !Array.isArray(first)
      ) {
        const typeName = `${rootName}${capitalize(propName!)}Type`;
        typeDefs.push(generateObjectType(first, typeName));
        return `${typeName}[]`;
      } else {
        return `${parseValue(first, propName, parentName)}[]`;
      }
    }

    // Object
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const typeName = `${rootName}${capitalize(propName!)}Type`;
      typeDefs.push(generateObjectType(value, typeName));
      return typeName;
    }

    return "any";
  };

  const generateObjectType = (
    obj: Record<string, JSONValue>,
    typeName: string,
  ): string => {
    const entries = Object.entries(obj)
      .map(([key, val]) => `  ${key}: ${parseValue(val, key, typeName)};`)
      .join("\n");

    return `type ${typeName} = {\n${entries}\n};`;
  };

  let mainType = "";

  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    const entries = Object.entries(obj)
      .map(([key, val]) => `  ${key}: ${parseValue(val, key, rootName)};`)
      .join("\n");
    mainType = `export interface ${rootName}Type {\n${entries}\n}`;
  } else {
    mainType = `export type ${rootName}Type = ${parseValue(obj, rootName)}`;
  }

  return [...typeDefs, mainType].join("\n\n");
};
