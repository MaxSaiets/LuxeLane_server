const Router = require('express')
const router = new Router() 
const subCategoriesController = require('../controllers/subCategoriesController')


router.get('/subCategories', subCategoriesController.getSubCategories)
router.post('/addSubCategories', subCategoriesController.addSubCategories)

router.delete('/deleteSubCategory/:id', subCategoriesController.deleteSubCategory) 

router.get('/getSubCategoriesIcons', subCategoriesController.getSubCategoriesIcons) 
router.delete('/deleteImgSubCategory/:id', subCategoriesController.deleteImgSubCategory) 

module.exports = router