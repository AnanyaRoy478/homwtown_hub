const router = require('express').Router();
const n = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', n.list);
router.get('/unread-count', n.unreadCount);
router.put('/read-all', n.markAllRead);
router.put('/:id/read', n.markRead);

module.exports = router;
