'use client';

import { useState, useEffect } from 'react';
import DataUploader from '@/components/DataUploader';
import ResponsePairViewer from '@/components/ResponsePairViewer';
import DownloadButton from '@/components/DownloadButton';
import { initializeDB, loadDataIntoDB, getRandomPair, savePairResult, getResults } from '@/lib/dataHandler';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';
import styles from './page.module.css';

export default function Home() {
  const [db, setDB] = useState<AsyncDuckDB | null>(null);
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [results, setResults] = useState<Array<{ accepted: string, rejected: string }>>([]);

  useEffect(() => {
    initializeDB().then(setDB);
  }, []);

  const handleDataUpload = async (data: string[][]) => {
    if (db) {
      await loadDataIntoDB(db, data);
      loadNextPair();
    }
  };

  const loadNextPair = async () => {
    if (db) {
      const pair = await getRandomPair(db);
      setCurrentPair(pair);
    }
  };

  const handlePreference = async (preferredIndex: number) => {
    if (db && currentPair) {
      await savePairResult(db, currentPair, preferredIndex);
      const updatedResults = await getResults(db);
      setResults(updatedResults);
      loadNextPair();
    }
  };

  return (
    <main className={styles['main']}>
      <h1 className={styles['title']}>DPO Review App</h1>
      <DataUploader onUpload={handleDataUpload} />
      {currentPair && (
        <ResponsePairViewer
          pair={currentPair}
          onPreference={handlePreference}
        />
      )}
      <DownloadButton results={results} />
    </main>
  );
}