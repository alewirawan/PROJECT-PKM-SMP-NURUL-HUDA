import { is } from "drizzle-orm";
import { PgTable, getTableConfig, isPgEnum } from "drizzle-orm/pg-core";
import * as schema from "../db/schema/index.js";

const lines = [
  "Project smp_nurul_huda {",
  "  database_type: 'PostgreSQL'",
  "}",
  "",
];
for (const value of Object.values(schema)) {
  if (isPgEnum(value)) {
    lines.push(
      `Enum ${value.enumName} {`,
      ...value.enumValues.map((item) => `  ${JSON.stringify(item)}`),
      "}",
      "",
    );
  }
}
const tables = Object.values(schema)
  .filter((value) => is(value, PgTable))
  .map((table) => getTableConfig(table));
for (const table of tables) {
  lines.push(`Table ${table.name} {`);
  for (const column of table.columns) {
    const options = [
      column.primary ? "pk" : "",
      column.notNull ? "not null" : "",
      column.isUnique ? "unique" : "",
    ].filter(Boolean);
    lines.push(
      `  ${column.name} ${JSON.stringify(column.getSQLType())}${options.length ? ` [${options.join(", ")}]` : ""}`,
    );
  }
  const simpleIndexes = table.indexes.filter(
    (index) =>
      !index.config.where &&
      index.config.columns.every(
        (column) => "name" in column && typeof column.name === "string",
      ),
  );
  if (table.uniqueConstraints.length || simpleIndexes.length) {
    lines.push("  indexes {");
    for (const unique of table.uniqueConstraints)
      lines.push(
        `    (${unique.columns.map((column) => column.name).join(", ")}) [unique]`,
      );
    for (const index of simpleIndexes) {
      const names = index.config.columns.map((column) =>
        "name" in column ? column.name : "",
      );
      lines.push(
        `    (${names.join(", ")})${index.config.unique ? " [unique]" : ""}`,
      );
    }
    lines.push("  }");
  }
  lines.push("}", "");
}
for (const table of tables) {
  for (const key of table.foreignKeys) {
    const reference = key.reference();
    const target = getTableConfig(reference.foreignTable).name;
    const columns = reference.columns.map((column) => column.name);
    const foreignColumns = reference.foreignColumns.map(
      (column) => column.name,
    );
    const keyText = (names: string[]) =>
      names.length === 1 ? names[0] : `(${names.join(", ")})`;
    lines.push(
      `Ref: ${table.name}.${keyText(columns)} > ${target}.${keyText(foreignColumns)} [delete: ${key.onDelete ?? "no action"}]`,
    );
  }
}
console.log(lines.join("\n"));
