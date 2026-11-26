import { Schema, model } from 'mongoose';

const workoutSchema = new Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  focus: { type: String, required: [true, 'Focus is required'], trim: true },
  minutes: { type: Number, required: [true, 'Minutes are required'], min: [1, 'Minutes must be positive'] },
  difficulty: { type: String, required: [true, 'Difficulty is required'], trim: true },
});

export const Workout = model('Workout', workoutSchema);
