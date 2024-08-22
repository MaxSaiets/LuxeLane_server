const Router = require('express')
const router = new Router() 

const BasketController = require('../controllers/basketController');

router.post('/addItemToBasket', BasketController.addProductToBasket);
router.get('/fetchUserBasket/:userId', BasketController.getBasketProducts);
router.delete('/deleteBasketItem', BasketController.removeProductFromBasket);
router.put('/updateQuantityItemInBasket', BasketController.updateProductQuantityInBasket);

module.exports = router