const Router = require('express')
const router = new Router() 

const FavoriteController = require('../controllers/favoriteController')

router.post('/addFavoriteItem', FavoriteController.addFavoriteProduct);
router.get('/fetchUserFavorites/:userId', FavoriteController.getFavoriteProducts);
router.delete('/deleteFavoriteItem', FavoriteController.removeFavoriteProduct);
router.delete('/removeFavoriteList', FavoriteController.removeFavoriteList);

module.exports = router