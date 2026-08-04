export const normalizeDataType = (type: string) => {
  if (!type) return 'any';

  const lowerType = type.toLowerCase();

  if (lowerType === 'integer') {
    return 'number';
  }

  return type;
};

export const generateNestedTypeName = (propertyName: string) => {
  if (!propertyName) return 'UnknownType';

  return propertyName.charAt(0).toUpperCase() + propertyName.slice(1);
};
