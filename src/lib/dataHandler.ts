import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import * as duckdb from '@duckdb/duckdb-wasm';

let db: AsyncDuckDB | null = null;

export async function initializeDB(): Promise<AsyncDuckDB> {
  if (db) return db;

  try {
    const DUCKDB_BUNDLES: duckdb.DuckDBBundles = {
      mvp: {
        mainModule: '/duckdb-mvp.wasm',
        mainWorker: '/duckdb-browser-mvp.worker.js',
      },
      eh: {
        mainModule: '/duckdb-eh.wasm',
        mainWorker: '/duckdb-browser-eh.worker.js',
      },
    };

    const bundle = await duckdb.selectBundle(DUCKDB_BUNDLES);
    const worker = new Worker(bundle.mainWorker!);
    const logger = new duckdb.ConsoleLogger();
    db = new AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    const conn = await db.connect();
    await conn.query(`
      CREATE TABLE responses (id INTEGER, response TEXT);
      CREATE TABLE results (accepted TEXT, rejected TEXT);
    `);
    await conn.close();

    return db;
  } catch (error) {
    console.error('Failed to initialize DuckDB:', error);
    throw error;
  }
}

export async function loadDataIntoDB(db: AsyncDuckDB, data: string[][]): Promise<void> {
  const conn = await db.connect();
  try {
    // Assuming the first row is headers, we'll skip it
    const values = data.slice(1)
      .map((row, index) => {
        const response = row[1];
        if (response === undefined) {
          console.warn(`Row ${index + 1} has no response, skipping`);
          return null;
        }
        return `(${index}, '${response.replace(/'/g, "''")}')`
      })
      .filter((value): value is string => value !== null)
      .join(',');

    if (values.length > 0) {
      await conn.query(`
        INSERT INTO responses (id, response)
        VALUES ${values}
      `);
    } else {
      console.warn('No valid data to insert');
    }
  } finally {
    await conn.close();
  }
}

export async function getRandomPair(db: AsyncDuckDB): Promise<[string, string]> {
  const conn = await db.connect();
  try {
    const result = await conn.query(`
      SELECT response FROM responses
      ORDER BY RANDOM()
      LIMIT 2
    `);
    const responses = result.toArray().map((row: { response: string }) => row.response);
    return [responses[0], responses[1]];
  } finally {
    await conn.close();
  }
}

function escapeString(str: string): string {
  return str.replace(/'/g, "''");
}

function validateInput(str: string): boolean {
  return str.length > 0 && str.length <= 1000 && /^[a-zA-Z0-9\s.,!?-]+$/.test(str);
}

export async function savePairResult(db: AsyncDuckDB, pair: [string, string], preferredIndex: number): Promise<void> {
  if (pair.length !== 2 || preferredIndex < 0 || preferredIndex > 1) {
    throw new Error('Invalid input: pair must contain exactly two strings and preferredIndex must be 0 or 1');
  }

  const accepted = pair[preferredIndex];
  const rejected = pair[1 - preferredIndex];

  if (typeof accepted !== 'string' || typeof rejected !== 'string') {
    throw new Error('Invalid input: both elements of the pair must be strings');
  }

  if (!validateInput(accepted) || !validateInput(rejected)) {
    throw new Error('Invalid input: strings contain disallowed characters or are of incorrect length');
  }

  const conn = await db.connect();
  try {
    const escapedAccepted = escapeString(accepted);
    const escapedRejected = escapeString(rejected);
    await conn.query(`
      INSERT INTO results (accepted, rejected)
      VALUES ('${escapedAccepted}', '${escapedRejected}')
    `);
  } finally {
    await conn.close();
  }
}

export async function getResults(db: AsyncDuckDB): Promise<Array<{ accepted: string, rejected: string }>> {
  const conn = await db.connect();
  try {
    const result = await conn.query(`SELECT * FROM results`);
    return result.toArray() as Array<{ accepted: string, rejected: string }>;
  } finally {
    await conn.close();
  }
}
