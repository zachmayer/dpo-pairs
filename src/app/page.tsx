'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import DataUploader from '@/components/DataUploader';
import ResponsePairViewer from '@/components/ResponsePairViewer';
import DownloadButton from '@/components/DownloadButton';
import { initializeDB, loadDataIntoDB, getRandomPair, savePairResult, getResults, clearAllData, getDataStatus } from '@/lib/dataHandler';
import type { AsyncDuckDB } from '@duckdb/duckdb-wasm';

export default function Home() {
  const [db, setDB] = useState<AsyncDuckDB | null>(null);
  const [currentPair, setCurrentPair] = useState<[string, string] | null>(null);
  const [results, setResults] = useState<Array<{ accepted: string, rejected: string }>>([]);
  const [dataStatus, setDataStatus] = useState<{ responsesCount: number, resultsCount: number } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { db: initializedDB, status } = await initializeDB();
        setDB(initializedDB);
        setDataStatus(status);
        if (status.responsesCount >= 2) {
          await loadNextPair(initializedDB);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        setError('Failed to initialize the application. Please try again.');
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  const loadNextPair = async (database: AsyncDuckDB) => {
    try {
      const pair = await getRandomPair(database);
      setCurrentPair(pair);
      setError(null);
    } catch (error) {
      console.error('Failed to load next pair:', error);
      setError('Failed to load response pair. Please try uploading more data.');
      setCurrentPair(null);
    }
  };

  const handleDataUpload = async (data: string[][]) => {
    if (db) {
      try {
        await loadDataIntoDB(db, data);
        const status = await getDataStatus();
        setDataStatus(status);
        if (status.responsesCount >= 2) {
          await loadNextPair(db);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Failed to load data. Please check your file and try again.');
      }
    }
  };

  const handlePreference = async (preferredIndex: number) => {
    if (db && currentPair) {
      try {
        await savePairResult(db, currentPair, preferredIndex);
        const updatedResults = await getResults(db);
        setResults(updatedResults);
        await loadNextPair(db);
        const status = await getDataStatus();
        setDataStatus(status);
      } catch (error) {
        console.error('Failed to save preference:', error);
        setError('Failed to save preference. Please try again.');
      }
    }
  };

  const handleClearData = async () => {
    if (db) {
      try {
        await clearAllData();
        const status = await getDataStatus();
        setDataStatus(status);
        setCurrentPair(null);
        setResults([]);
        setError(null);
      } catch (error) {
        console.error('Failed to clear data:', error);
        setError('Failed to clear data. Please try again.');
      }
    }
  };

  if (isInitializing) {
    return <div className={styles['main']}>Initializing...</div>;
  }

  return (
    <main className={styles['main']}>
      <h1 className={styles['title']}>DPO Review App</h1>
      <DataUploader onUpload={handleDataUpload} />
      {error && <div className={styles['error']}>{error}</div>}
      {currentPair ? (
        <ResponsePairViewer
          pair={currentPair}
          onPreference={handlePreference}
        />
      ) : (
        <div>No responses available. Please upload data.</div>
      )}
      <DownloadButton results={results} />
      {dataStatus && (
        <div>
          <p>Responses: {dataStatus.responsesCount}</p>
          <p>Results: {dataStatus.resultsCount}</p>
        </div>
      )}
      <button onClick={handleClearData}>Clear All Data</button>
    </main>
  );
}
