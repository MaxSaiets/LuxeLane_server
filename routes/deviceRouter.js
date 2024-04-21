const Router = require('express')
const router = new Router() 
const deviceController = require('../controllers/deviceController')

// методи для device
router.post('/', deviceController.create) //метод для створення 
router.get('/', deviceController.getAll) //метод для отримування
router.get('/:id', deviceController.getOne) //мутод для отримування окремого девайса

module.exports = router

