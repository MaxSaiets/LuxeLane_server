const Router = require('express')
const router = new Router() 

const RecentlyViewedController = require('../controllers/recentlyViewedController');

router.post('/addRecentlyViewedItem', RecentlyViewedController.addRecentlyViewedProduct);
router.get('/fetchUsersRecentlyViewed/:userId', RecentlyViewedController.getRecentlyViewedProducts);
router.delete('/deleteRecentlyViewdItem', RecentlyViewedController.removeRecentlyViewedProduct);
router.delete('/deleteRecentlyViewdAll', RecentlyViewedController.removeRecentlyViewedList);

module.exports = router 