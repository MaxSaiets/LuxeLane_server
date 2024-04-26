const { Type, Brand, Product, SubCategory, Category } = require('../models/models')
const ApiError = require('../error/ApiError')

class TypeController {
    async getAll(req, res, next) {
        try {
            const types = await Type.findAll()
            
            return res.json(types)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async create(req, res, next) {
        try {
            const {name} = req.body
            const type = await Type.create({name})

            return res.json({type})
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async delete(req, res, next) {
        try {
            const {id} = req.params
            const type = await Type.destroy({where: {id}})

            return res.json({type})
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async update(req, res, next) {
        try {
            const { id } = req.params;
            const { name } = req.body;
            
            const type = await Type.findByPk(id);
            
            if (!type) {
                throw ApiError.badRequest(`Brand with id ${id} not found`);
            }
    
            if (name) {
                type.name = name;
                await type.save();
            }
    
            return res.json({type})
        } catch (e) {
            return next(ApiError.badRequest(e.message))
        }
    }

    async getCategoryTypes(req, res, next) {
        try {
            const {categoryData} = req.body;

            const products = await Product.findAll({
                include: [{
                    model: Category,
                    where: { id: categoryData.id }
                }, {
                    model: SubCategory
                }, {
                    model: Type
                }]
            });

            const data = new Set();
            
            for (let product of products) {
                for (let subCategory of product.dataValues.subCategories) {
                    const entry = {
                        [subCategory.name]: product.dataValues.types.map(type => type.name)
                    };
            
                    data.add(JSON.stringify(entry));
                }
            }
            
            const uniqueData = Array.from(data).map(entry => JSON.parse(entry));
            console.log("UNIQUE DATA", uniqueData);

            return res.json(uniqueData);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }
}

module.exports = new TypeController()