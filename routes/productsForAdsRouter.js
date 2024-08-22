const Router = require('express')
const router = new Router() 

const ProductsForAdsController = require('../controllers/productsForAdsController');

router.get('/fetchProductsForAdsBlock', ProductsForAdsController.getRandomProductsForAds);

module.exports = router