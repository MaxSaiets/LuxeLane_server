const {Brand} = require('../models/models')
const ApiError = require('../error/ApiError')

class BrandController {
    async getAll(req, res, next) {
        try {
            const brands = await Brand.findAll()

            return res.json(brands)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async create(req, res, next) {
        try {
            const {name} = req.body

            const brand = await Brand.create({name})
            return res.json({brand})
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params

            const brand = await Brand.destroy({where: {id}})
            return res.json({brand})
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async update(req, res, next) {
        try {
            const {id} = req.params
            const {name} = req.body
    
            const brand = await Brand.update({name}, {where: {id}})
            return res.json({brand})
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new BrandController()