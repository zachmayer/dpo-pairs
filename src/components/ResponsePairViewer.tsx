'use client';

interface ResponsePairViewerProps {
  pair: [string, string];
  onPreference: (preferredIndex: number) => void;
}

export default function ResponsePairViewer({ pair, onPreference }: ResponsePairViewerProps) {
  return (
    <div className="response-pair">
      <div className="response">
        <h3>Response A</h3>
        <p>{pair[0]}</p>
        <button onClick={() => onPreference(0)}>Prefer A</button>
      </div>
      <div className="response">
        <h3>Response B</h3>
        <p>{pair[1]}</p>
        <button onClick={() => onPreference(1)}>Prefer B</button>
      </div>
    </div>
  );
}
