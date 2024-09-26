import { copyFile, mkdir, readdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyDuckDBFiles() {
  const duckdbDir = path.join(__dirname, '..', 'node_modules', '@duckdb', 'duckdb-wasm');
  const publicDir = path.join(__dirname, '..', 'public');

  try {
    console.log('Searching for DuckDB files in:', duckdbDir);
    const files = await readdir(duckdbDir, { recursive: true });
    console.log('Files found:', files);

    const filesToCopy = files.filter(file => 
      file.endsWith('.wasm') || file.endsWith('.worker.js')
    );

    // Ensure the public directory exists
    await mkdir(publicDir, { recursive: true });

    for (const file of filesToCopy) {
      const srcPath = path.join(duckdbDir, file);
      const destPath = path.join(publicDir, path.basename(file));
      
      try {
        await copyFile(srcPath, destPath);
        console.log(`Copied ${srcPath} to ${destPath}`);
      } catch (err) {
        console.error(`Failed to copy ${srcPath}:`, err);
      }
    }
  } catch (error) {
    console.error('Error copying DuckDB files:', error);
  }
}

copyDuckDBFiles();
