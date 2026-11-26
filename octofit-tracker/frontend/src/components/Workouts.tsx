import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

interface WorkoutSuggestion {
  title: string;
  focus: string;
  minutes: number;
  difficulty: string;
  reason: string;
}

const userEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
      .then(({ suggestions: result }) => {
        if (active) setSuggestions(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load workout suggestions.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section aria-labelledby="workouts-heading">
      <h2 id="workouts-heading">Workout suggestions</h2>
      <p>Recommendations for {userEmail} based on fitness goals and activity.</p>
      {loading && <p role="status">Loading workout suggestions...</p>}
      {error && <p role="alert">Unable to load workout suggestions: {error}</p>}
      {!loading && !error && suggestions.length === 0 && <p>No workout suggestions available.</p>}
      {!loading && !error && suggestions.length > 0 && (
        <ul className="list-group">
          {suggestions.map((workout) => (
            <li className="list-group-item" key={workout.title}>
              <strong>{workout.title}</strong> · {workout.focus} · {workout.minutes} minutes · {workout.difficulty}
              <p className="mb-0">{workout.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
