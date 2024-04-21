const Router = require('express')
const router = new Router() // головний роутер 
const deviceRouter = require('./deviceRouter')
const userRouter = require('./userRouter')
const typeRouter = require('./typeRouter')
const brandRouter = require('./brandRouter')
const usersInfoRouter = require('./usersInfoRouter')
const categoryRouter = require('./categoryRouter')
const subCategoryRouter = require('./subCategoryRouter')
const productRouter = require('./productRouter')

const uploadRouter = require('./uploadRouter')

//под роутери
router.use('/user', userRouter)

router.use('/brand', brandRouter)
router.use('/type', typeRouter)

router.use('/device', deviceRouter)

router.use('/usersInfo', usersInfoRouter)
router.use('/categories', categoryRouter)

router.use('/subCategories', subCategoryRouter)

router.use('/products', productRouter)

router.use('/upload', uploadRouter)

module.exports = router

