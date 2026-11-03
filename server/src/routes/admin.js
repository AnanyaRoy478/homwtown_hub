const router = require('express').Router();
const a = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/stats', a.stats);
router.get('/communities', a.communities);
router.put('/communities/:id/status', a.setCommunityStatus);
router.get('/users', a.users);
router.put('/users/:id', a.updateUser);
router.get('/moderators', a.moderators);
router.get('/reports', a.reports);
router.put('/reports/:id', a.resolveReport);
router.get('/categories', a.listCategories);
router.post('/categories', a.createCategory);
router.delete('/categories/:id', a.deleteCategory);

module.exports = router;
