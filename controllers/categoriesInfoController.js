const { SubCategory, Category, Image, CategoryImage } = require('../models/models')
const ApiError = require('../error/ApiError')
const admin = require('firebase-admin');

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fsPromises = require('fs').promises;
const verifyAdminToken = require('../utils/users/verifyAdminToken')

class CategoriesController {
    // CATEGORIES
    async getCategories(req, res, next){
        try {
            const categories = await Category.findAll({
                include: [{
                  model: Image,
                  as: 'images',
                  through: { attributes: [] },
                  attributes: ['imgName', 'imgSrc'],
                }]
            });

            categories.forEach(category => {
                    category.images.forEach(image => {
                    image.imgSrc = `http://${req.headers.host}/${image.imgSrc.replace('static\\', '').replace(/\\/g, '/')}`;
                });
            });  

            return res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            next(ApiError.internal('Internal server error'));
        }
    }
    
    async deleteImgCategory(req, res) {
        try {
            await verifyAdminToken(req);

            const { id } = req.params;

            const image = await Image.findByPk(id);
    
            if (image) {
                const categoryImage = await CategoryImage.findOne({ where: { imageId: id } });

                if (categoryImage) {
                    await categoryImage.destroy();
                }
    
                await image.destroy();
    
                fs.unlink(path.join(__dirname, '../', image.imgSrc), err => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        return res.status(500).json({ message: 'Error deleting file' });
                    }
    
                    return res.json({ message: 'Icon and associated category deleted successfully' });
                });
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
            await verifyAdminToken(req);

            const { id } = req.params;

            const category = await Category.findByPk(id);
    
            if (category) {
                const categoryImages = await CategoryImage.findAll({ where: { categoryId: id } });
    
                for (let categoryImage of categoryImages) {
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
            await verifyAdminToken(req);

            const images = await Image.findAll({
                where: { imageableType: 'category' }
            });

            const icons = images.map(image => {

                const url = `http://${req.headers.host}/${image.imgSrc.replace('static\\', '').replace(/\\/g, '/')}`;

                return {
                    id: image.id,
                    fileName: image.imgName,
                    fileUrl: url,
                };
            });

            return res.json(icons);

        } catch (error) {
            console.error('Error deleting user:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getCategoriesNameId(req, res) {
        try {
            await verifyAdminToken(req);

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