import { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import * as duckdb from '@duckdb/duckdb-wasm';

let db: AsyncDuckDB | null = null;

export async function initializeDB(forceFresh: boolean = false): Promise<{ db: AsyncDuckDB, status: { responsesCount: number, resultsCount: number } }> {
  if (!db) {
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
    } catch (error) {
      console.error('Failed to initialize DuckDB:', error);
      throw error;
    }
  }

  const conn = await db.connect();

  try {
    if (forceFresh) {
      await conn.query(`
        DROP TABLE IF EXISTS responses;
        DROP TABLE IF EXISTS results;
      `);
    }

    // Check if tables exist, create them if they don't
    await conn.query(`
      CREATE TABLE IF NOT EXISTS responses (id INTEGER, response TEXT);
      CREATE TABLE IF NOT EXISTS results (accepted TEXT, rejected TEXT);
    `);

    const status = await getDataStatusInternal(conn);
    return { db, status };
  } finally {
    await conn.close();
  }
}

async function getDataStatusInternal(conn: duckdb.AsyncDuckDBConnection): Promise<{ responsesCount: number, resultsCount: number }> {
  const responsesCount = await conn.query('SELECT COUNT(*) as count FROM responses');
  const resultsCount = await conn.query('SELECT COUNT(*) as count FROM results');
  return {
    responsesCount: responsesCount.toArray()[0].count,
    resultsCount: resultsCount.toArray()[0].count
  };
}

export async function getDataStatus(): Promise<{ responsesCount: number, resultsCount: number }> {
  if (!db) {
    const { status } = await initializeDB();
    return status;
  }
  
  const conn = await db.connect();
  try {
    return await getDataStatusInternal(conn);
  } finally {
    await conn.close();
  }
}

export async function clearAllData(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  const conn = await db.connect();
  try {
    await conn.query(`
      DELETE FROM responses;
      DELETE FROM results;
    `);
  } finally {
    await conn.close();
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
    const responses = result.toArray().map(row => row.response.toString());
    if (responses.length < 2) {
      throw new Error('Not enough responses in the database');
    }
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
