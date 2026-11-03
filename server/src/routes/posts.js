const router = require('express').Router();
const p = require('../controllers/postController');
const cm = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/feed', p.feed);
router.delete('/comments/:commentId', cm.remove);
router.get('/:id', p.getOne);
router.delete('/:id', p.remove);
router.put('/:id/like', p.toggleLike);
router.post('/:id/share', p.share);
router.put('/:id/pin', p.togglePin);
router.get('/:id/comments', cm.list);
router.post('/:id/comments', cm.create);

module.exports = router;
