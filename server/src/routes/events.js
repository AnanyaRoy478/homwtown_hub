const router = require('express').Router();
const e = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/mine', e.mine);
router.put('/:id/rsvp', e.toggleRsvp);
router.put('/:id', e.update);
router.delete('/:id', e.remove);

module.exports = router;
