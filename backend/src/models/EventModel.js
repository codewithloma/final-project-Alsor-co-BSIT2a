import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    org_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CBO',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,       // e.g. "1:00 PM"
      default: 'TBA',
    },
    venue: {
      type: String,
      default: 'TBA',
      maxlength: 150,
    },
    event_type: {
      type: String,
      enum: ['Assembly', 'Seminar', 'Competition', 'Training',
             'Outreach', 'Social', 'University', 'Academic',
             'Special Event', 'Awarding', 'Other'],
      default: 'Other',
    },
    // Users who clicked RSVP / "Going"
    rsvp_users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    is_cancelled: { type: Boolean, default: false },
    banner_url:   { type: String, default: '' },
  },
  { timestamps: true }
);

// Virtual: rsvp count
eventSchema.virtual('rsvp_count').get(function () {
  return this.rsvp_users.length;
});

// Virtual: status relative to now
eventSchema.virtual('status').get(function () {
  const now  = new Date();
  const evtD = new Date(this.date);
  evtD.setHours(0, 0, 0, 0);
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  if (this.is_cancelled) return 'cancelled';
  if (evtD.getTime() === todayD.getTime()) return 'today';
  const diff = evtD - todayD;
  if (diff > 0 && diff <= 7 * 24 * 3600 * 1000) return 'soon';
  if (diff > 0) return 'upcoming';
  return 'past';
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

// Index for chronological queries
eventSchema.index({ date: 1 });
eventSchema.index({ org_id: 1, date: 1 });

export default mongoose.model('Event', eventSchema);