import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface Team {
  name: string;
  mascot?: string;
  members: string[];
}

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => {
        if (active) setTeams(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load teams.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section aria-labelledby="teams-heading">
      <h2 id="teams-heading">Teams</h2>
      <p>Manage teams and members.</p>
      {loading && <p role="status">Loading teams...</p>}
      {error && <p role="alert">Unable to load teams: {error}</p>}
      {!loading && !error && teams.length === 0 && <p>No teams yet.</p>}
      {!loading && !error && teams.length > 0 && (
        <ul className="list-group">
          {teams.map((team) => (
            <li className="list-group-item" key={team.name}>
              <strong>{team.name}</strong>
              {team.mascot && <span> · Mascot: {team.mascot}</span>}
              <span> · {team.members?.length ?? 0} members</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
