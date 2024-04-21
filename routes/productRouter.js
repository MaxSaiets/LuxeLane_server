const Router = require('express')
const router = new Router() 

const productController = require('../controllers/productController')

const checkVerifyAdminMiddleware = require('../middleware/checkVerifyAdminMiddleware')

router.get('/fetchProducts', productController.getAll);
router.post('/addNewProduct', checkVerifyAdminMiddleware, productController.create);
router.delete('/deleteProduct/:id', checkVerifyAdminMiddleware, productController.delete);
router.put('/updateProduct/:id', checkVerifyAdminMiddleware, productController.update);

router.post('/fetchProductsData', productController.fetchProductsData);

module.exports = router