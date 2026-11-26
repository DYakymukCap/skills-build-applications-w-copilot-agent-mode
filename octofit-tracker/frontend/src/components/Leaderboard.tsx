import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface LeaderboardEntry {
  teamName: string;
  totalPoints: number;
  rank: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: result }) => {
        if (active) setLeaderboard(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load the leaderboard.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section aria-labelledby="leaderboard-heading">
      <h2 id="leaderboard-heading">Leaderboard</h2>
      <p>Compare team point totals.</p>
      {loading && <p role="status">Loading leaderboard...</p>}
      {error && <p role="alert">Unable to load the leaderboard: {error}</p>}
      {!loading && !error && leaderboard.length === 0 && <p>No leaderboard scores yet.</p>}
      {!loading && !error && leaderboard.length > 0 && (
        <ol className="list-group list-group-numbered">
          {leaderboard.map((entry) => (
            <li className="list-group-item" key={entry.teamName}>
              {entry.teamName} · {entry.totalPoints} points
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
