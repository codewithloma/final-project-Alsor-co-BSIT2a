import { Router } from 'express';
import { body } from 'express-validator';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  toggleRSVP,
  getEventStats,
} from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = Router();

const eventValidation = [
  body('title').trim().notEmpty().withMessage('Title is required.').isLength({ max: 150 }),
  body('content').trim().notEmpty().withMessage('Description is required.').isLength({ max: 1000 }),
  body('date').isISO8601().withMessage('Valid date (ISO 8601) is required.'),
  body('org_id').isMongoId().withMessage('Valid org_id is required.'),
];

// Public (read) - auth optional so is_going is populated when logged in
router.get('/',      getEvents);
router.get('/stats', getEventStats);
router.get('/:id',   getEventById);

// Protected
router.post('/',
  protect, authorize('cbo_officer', 'admin'),
  eventValidation,
  createEvent
);

router.put('/:id',
  protect, authorize('cbo_officer', 'admin'),
  updateEvent
);

router.delete('/:id',
  protect, authorize('admin'),
  deleteEvent
);

// Any logged-in student can RSVP
router.post('/:id/rsvp', protect, toggleRSVP);

export default router;