const { SubCategory, Category, Image, CategoryImage, TypeSubCategory, Type } = require('../models/models')
const ApiError = require('../error/ApiError')

class CategoriesController {
    async getCategoriesData(req, res, next){
        try {
            const categories = await Category.findAll({
                attributes: ['id',['name', 'categoryName']],
                include: [{
                  model: Image,
                  as: 'images',
                  through: { attributes: [] },
                  attributes: ['imgSrc'],
                }]
            });

            const subCategoriesWithTypes = await SubCategory.findAll({
                attributes: ['id', 'categoryId',['name', 'subCategoryName']],
                include: [
                    {
                        model: Type,
                        attributes: ['id',['name', 'typeName']],
                        through: {
                            attributes: []
                        }
                    },{
                        model: Image,
                        as:  'images',
                        through: { attributes: [] },
                        attributes: ['imgSrc'],
                    }
                ]
            });

            const formattedCategories = categories.map(category => {
                return {
                    id: category.id,
                    categoryName: category.dataValues.categoryName,
                    categoryImage: category.dataValues.images[0].imgSrc,
                    subCategories: subCategoriesWithTypes
                        .filter(subCategory => subCategory.categoryId === category.id)
                        .map(subCategory => ({
                            subCategoryName: subCategory.dataValues.subCategoryName,
                            subCategoryImage: subCategory.images[0].imgSrc,
                            types: subCategory.types.map(type => ({
                                typeName: type.dataValues.typeName
                            }))
                        }))
                };
            });

            return res.json(formattedCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            next(ApiError.internal('Internal server error'));
        }
    }
    
    async addCategory(req, res, next) {
            try {
                const { nameOfCategory, existingImageId, imageName, imageUrl } = req.body;

                const category = await Category.create({
                    name: nameOfCategory,
                });

                let imageId;

                if (existingImageId && existingImageId !== "undefined") { // "undefined" because existingImageId is a string
                    imageId = existingImageId;
                } else if (imageUrl) {
                    let image = await Image.findOne({ where: { imgSrc: imageUrl } });

                    try {
                        image = await Image.create({
                            imgName: imageName,
                            imgSrc: imageUrl,
                            imageableType: 'category',
                        });
                    } catch (error) {
                        console.error('Error creating image:', error);
                        return res.status(500).send('Error creating image');
                    }

                    imageId = image.id;
                } else {
                    return res.status(400).json({ error: 'No file uploaded or existing image provided' });
                }

                await CategoryImage.create({ categoryId: category.id, imageId: imageId });

                return res.json({ message: 'Category uploaded successfully', category });
            } catch (err) {
                console.error(err);
                return res.status(500).send('Error creating category');
            }
    };
    async updateCategory(req, res, next) {
        try {
            const { id } = req.params;
            const { name, existingImageId, imageName, imageUrl } = req.body;
            
            const category = await Category.findByPk(id);
            
            if (!category) {
                throw ApiError.badRequest(`Category with id ${id} not found`);
            }
    
            if (name) {
                category.name = name;
                await category.save();
            }
            
            if (imageUrl && imageName) {
                const images = await category.getImages();
               
                if (images && images.length > 0) {
                    const image = images[0];
                    image.imgName = imageName;
                    image.imgSrc = imageUrl;
                    
                    await image.save();
                } else {
                    console.error(`Image with id ${existingImageId} not found`);
                }
            }
            
            return res.json(category);
        } catch (error) {
          console.error('Error updating category:', error);
          return next(ApiError.badRequest(error.message));
        }
    }
    async deleteImgCategory(req, res) {
        try {
            const { id } = req.params;

            const image = await Image.findByPk(id);
    
            if (image) {
                const categoryImage = await CategoryImage.findOne({ where: { imageId: id } });

                if (categoryImage) {
                    await categoryImage.destroy();
                }
    
                await image.destroy();
    
                return res.json({ message: 'Icon and associated category deleted successfully' });
            } else {
                return res.status(404).json({ message: 'Icon not found' });
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async deleteCategory(req, res) {
        try {

            const { id } = req.params;

            const category = await Category.findByPk(id);
    
            if (category) {
                const categoryImages = await CategoryImage.findAll({ where: { categoryId: id } });
    
                for (let categoryImage of categoryImages) {
                    const image = await Image.findByPk(categoryImage.imageId);
                    if (image) {
                        await image.destroy();
                    }
                    await categoryImage.destroy();
                }
                await category.destroy();
    
                return res.json({ message: 'Category and associated icons deleted successfully' });
            } else {
                return res.status(404).json({ message: 'Icon not found' });
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getCategoriesIcons(req, res) {
        try {
            const images = await Image.findAll({
                where: { imageableType: 'category' }
            });

            return res.json(images);
        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getCategoriesNameId(req, res) {
        try {
            const categories = await Category.findAll({
                attributes: ['id', 'name']
            });

            return res.json(categories);

        } catch (error) {
            console.error('Error getting categories:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
}

module.exports = new CategoriesController()