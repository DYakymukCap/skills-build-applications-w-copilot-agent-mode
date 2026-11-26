import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string): never {
  throw Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string): never {
  throw Object.assign(new Error(message), { status: 404 });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) badRequest('Activity details are required');

  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) badRequest('Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    badRequest('Minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) notFound('The specified user or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) badRequest('Team details are required');

  const { name, mascot, members = [] } = input;
  if (typeof name !== 'string' || !name.trim()) badRequest('Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) badRequest('Team mascot is required');
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    badRequest('Members must contain valid user IDs');
  }

  const uniqueMemberIds = [...new Set(members)];
  const memberCount = await User.countDocuments({ _id: { $in: uniqueMemberIds } });
  if (memberCount !== uniqueMemberIds.length) badRequest('Every team member must be an existing user');

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: uniqueMemberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

function focusForActivity(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'walk', 'walking', 'swim', 'swimming'].includes(normalized)) {
    return 'endurance';
  }
  if (['strength', 'weights', 'weight training'].includes(normalized)) return 'strength';
  if (['yoga', 'stretch', 'stretching', 'mobility'].includes(normalized)) return 'mobility';
  return normalized;
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) notFound('No user was found for that email address');

  const [workouts, recentActivity] = await Promise.all([
    Workout.find().lean(),
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const goalMatches = workouts.filter((workout) => workout.focus.trim().toLowerCase() === goal);
  const activityFocus = recentActivity ? focusForActivity(recentActivity.type) : undefined;
  const activityMatches = activityFocus
    ? workouts.filter((workout) => workout.focus.trim().toLowerCase() === activityFocus)
    : [];
  const matches = goalMatches.length > 0 ? goalMatches : activityMatches;

  if (matches.length === 0) return [];
  const reason = goalMatches.length > 0
    ? `Recommended for your ${user.fitnessGoal} fitness goal.`
    : `Recommended based on your recent ${recentActivity?.type} activity.`;

  return matches.map((workout) => ({ ...workout, reason }));
}

export { User };
