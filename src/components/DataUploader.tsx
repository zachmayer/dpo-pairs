'use client';

import { useCallback } from 'react';
import Papa from 'papaparse';

interface DataUploaderProps {
  onUpload: (data: string[][]) => void;
}

export default function DataUploader({ onUpload }: DataUploaderProps) {
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          onUpload(results.data as string[][]);
        },
        header: true,
      });
    }
  }, [onUpload]);

  return (
    <div>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
    </div>
  );
}
