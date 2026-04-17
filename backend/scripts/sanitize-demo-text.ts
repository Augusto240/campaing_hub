import { PrismaClient } from '@prisma/client';
import { repairLikelyMojibake } from '../src/utils/text-sanitizer';

type TableSummary = {
  table: string;
  scannedRows: number;
  changedRows: number;
  flaggedRows: number;
};

type ChangedRow = {
  table: string;
  id: string;
  columns: string[];
};

type FlaggedRow = {
  table: string;
  id: string;
  columns: string[];
  reasons: string[];
};

const prisma = new PrismaClient();

const TARGET_TABLES = [
  'campaigns',
  'wiki_pages',
  'core_pages',
  'sessions',
  'notifications',
  'characters',
  'items',
  'core_nodes',
] as const;

const isSafeIdentifier = (value: string): boolean => /^[a-z_][a-z0-9_]*$/i.test(value);

const quoteIdentifier = (value: string): string => {
  if (!isSafeIdentifier(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }

  return `"${value}"`;
};

const hasIdColumn = async (table: string): Promise<boolean> => {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${table}
        AND column_name = 'id'
    ) AS "exists"
  `;

  return Boolean(rows[0]?.exists);
};

const getTextColumns = async (table: string): Promise<string[]> => {
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${table}
      AND data_type IN ('text', 'character varying')
    ORDER BY ordinal_position
  `;

  return rows.map((row) => row.column_name).filter((column) => column !== 'id');
};

async function main(): Promise<void> {
  const applyMode = process.argv.includes('--apply');
  const summaries: TableSummary[] = [];
  const changedRows: ChangedRow[] = [];
  const flaggedRows: FlaggedRow[] = [];

  for (const table of TARGET_TABLES) {
    if (!(await hasIdColumn(table))) {
      continue;
    }

    const textColumns = await getTextColumns(table);
    if (textColumns.length === 0) {
      summaries.push({
        table,
        scannedRows: 0,
        changedRows: 0,
        flaggedRows: 0,
      });
      continue;
    }

    const selectColumns = ['id', ...textColumns].map(quoteIdentifier).join(', ');
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT ${selectColumns} FROM ${quoteIdentifier(table)}`
    );

    let changedCount = 0;
    let flaggedCount = 0;

    for (const row of rows) {
      const rowId = String(row['id']);
      const updates: Record<string, string> = {};
      const changedColumns: string[] = [];
      const flaggedColumns: string[] = [];
      const reasons: string[] = [];

      for (const column of textColumns) {
        const rawValue = row[column];
        if (typeof rawValue !== 'string' || rawValue.length === 0) {
          continue;
        }

        const result = repairLikelyMojibake(rawValue);
        if (result.status === 'repaired' && result.value !== rawValue) {
          updates[column] = result.value;
          changedColumns.push(column);
        } else if (result.status === 'flagged') {
          flaggedColumns.push(column);
          if (result.reason) {
            reasons.push(`${column}: ${result.reason}`);
          }
        }
      }

      if (changedColumns.length > 0) {
        changedCount += 1;
        changedRows.push({
          table,
          id: rowId,
          columns: changedColumns,
        });

        if (applyMode) {
          const setClauses = Object.keys(updates)
            .map((column, index) => `${quoteIdentifier(column)} = $${index + 1}`)
            .join(', ');
          const values = Object.keys(updates).map((column) => updates[column]);

          await prisma.$executeRawUnsafe(
            `UPDATE ${quoteIdentifier(table)} SET ${setClauses} WHERE "id" = $${values.length + 1}`,
            ...values,
            rowId
          );
        }
      }

      if (flaggedColumns.length > 0) {
        flaggedCount += 1;
        flaggedRows.push({
          table,
          id: rowId,
          columns: flaggedColumns,
          reasons,
        });
      }
    }

    summaries.push({
      table,
      scannedRows: rows.length,
      changedRows: changedCount,
      flaggedRows: flaggedCount,
    });
  }

  const report = {
    mode: applyMode ? 'apply' : 'dry-run',
    summaries,
    changed_rows: changedRows,
    flagged_rows: flaggedRows,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
