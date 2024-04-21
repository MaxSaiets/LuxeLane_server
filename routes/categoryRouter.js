const Router = require('express')
const router = new Router() 
const categoriesInfoController = require('../controllers/categoriesInfoController')

router.get('/categories', categoriesInfoController.getCategories)  

router.delete('/deleteCategory/:id', categoriesInfoController.deleteCategory) 
router.delete('/deleteImgCategory/:id', categoriesInfoController.deleteImgCategory) 

router.get('/getCategoriesIcons', categoriesInfoController.getCategoriesIcons) 
router.get('/getCategoriesNameId', categoriesInfoController.getCategoriesNameId) 

module.exports = router