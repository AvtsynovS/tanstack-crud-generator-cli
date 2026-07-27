import { promises as fs } from "fs";
import path from "path";
import {
  DataProvider,
  EntitySpecification,
} from "../../shared/types/dataProvider.js";

export class JsonDataProvider implements DataProvider {
  private filePath: string;

  constructor(filePath: string) {
    // Приводим путь к абсолютному для надежности FS операции
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  /**
   * Читает JSON-файл и преобразует его в спецификацию сущностей
   */
  async getSpecification(): Promise<EntitySpecification[]> {
    try {
      const rawData = await fs.readFile(this.filePath, "utf-8");
      const parsed = JSON.parse(rawData);
      const dataArray = Array.isArray(parsed) ? parsed : [parsed];

      // Валидация на соответствие интерфейсу EntitySpecification
      const specifications: EntitySpecification[] = dataArray.map(
        (item, index) => {
          if (!item.name || typeof item.name !== "string") {
            throw new Error(
              `Invalid entity name at index ${index}. Property "name" is required.`,
            );
          }
          if (!Array.isArray(item.properties)) {
            throw new Error(
              `Entity "${item.name}" must have a "properties" array.`,
            );
          }

          return {
            name: item.name,
            properties: item.properties,
            nestedTypes: Array.isArray(item.nestedTypes)
              ? item.nestedTypes
              : undefined,
          };
        },
      );

      return specifications;
    } catch (error: any) {
      throw new Error(
        `[JsonDataProvider] Failed to parse JSON file: ${error.message}`,
      );
    }
  }
}
