import { DataSource } from 'typeorm';

export async function executeReadOnlyQuery(
  dataSource: DataSource,
  table: string,
  limit = 10,
): Promise<{ rows: unknown[] }> {
  const allowedTables = ['conversations', 'messages', 'agent_configs', 'knowledge_items'];
  if (!allowedTables.includes(table)) {
    throw new Error(`Table not allowed: ${table}`);
  }

  const rows = await dataSource.query(
    `SELECT * FROM ${table} ORDER BY created_at DESC LIMIT $1`,
    [Math.min(limit, 50)],
  );

  return { rows };
}
