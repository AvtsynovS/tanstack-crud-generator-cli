import {
  EntitySpecification,
  EntityProperty,
} from "../shared/types/dataProvider.js";

const renderProperty = (prop: EntityProperty): string => {
  const isOptional = !prop.required;
  const comment = prop.description ? `  /** ${prop.description} */\n` : "";
  return `${comment}  ${prop.name}${isOptional ? "?" : ""}: ${prop.type};`;
};

export const generateTsTypeFromSpec = (spec: EntitySpecification): string => {
  const typeDefs: string[] = [];

  if (spec.nestedTypes && Array.isArray(spec.nestedTypes)) {
    spec.nestedTypes.forEach((nested) => {
      const entries = nested.properties.map(renderProperty).join("\n");
      typeDefs.push(`export type ${nested.name} = {\n${entries}\n};`);
    });
  }

  const mainEntries = spec.properties.map(renderProperty).join("\n");
  const mainType = `export interface ${spec.name}Type {\n${mainEntries}\n}`;

  return [...typeDefs, mainType].join("\n\n");
};
