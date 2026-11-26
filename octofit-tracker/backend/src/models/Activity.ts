import { Schema, model } from 'mongoose';

const activitySchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'] },
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: [true, 'Team is required'] },
  type: { type: String, required: [true, 'Activity type is required'], trim: true },
  minutes: { type: Number, required: [true, 'Minutes are required'], min: [1, 'Minutes must be positive'] },
  points: { type: Number, required: [true, 'Points are required'], min: [0, 'Points cannot be negative'] },
  occurredAt: { type: Date, required: [true, 'Activity date is required'] },
});

export const Activity = model('Activity', activitySchema);
