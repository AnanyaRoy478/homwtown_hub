const router = require('express').Router();
const c = require('../controllers/communityController');
const posts = require('../controllers/postController');
const events = require('../controllers/eventController');
const { protect, memberOf } = require('../middleware/auth');

router.use(protect);
router.get('/', c.list);
router.post('/', c.create);
router.get('/mine', c.mine);
router.get('/:communityId', c.getOne);
router.put('/:communityId', memberOf('moderator'), c.update);
router.post('/:communityId/join', c.join);
router.delete('/:communityId/leave', c.leave);
router.get('/:communityId/members', memberOf('member'), c.members);
router.get('/:communityId/requests', memberOf('moderator'), c.requests);
router.put('/:communityId/requests/:membershipId', memberOf('moderator'), c.decide);
router.put('/:communityId/members/:membershipId/role', memberOf('admin'), c.setRole);
router.delete('/:communityId/members/:membershipId', memberOf('moderator'), c.removeMember);

// Community-scoped content
router.get('/:communityId/posts', memberOf('member'), posts.listByCommunity);
router.post('/:communityId/posts', memberOf('member'), posts.create);
router.get('/:communityId/events', memberOf('member'), events.listByCommunity);
router.post('/:communityId/events', memberOf('member'), events.create);

module.exports = router;
