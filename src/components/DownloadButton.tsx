'use client';

import Papa from 'papaparse';

interface DownloadButtonProps {
  results: Array<{ accepted: string, rejected: string }>;
}

export default function DownloadButton({ results }: DownloadButtonProps) {
  const handleDownload = () => {
    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'dpo_results.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return <button onClick={handleDownload}>Download Results</button>;
}
