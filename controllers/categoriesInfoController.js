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
                  attributes: [ 'id', 'imgName', 'imgSrc'],
                }]
            });

            return res.json(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            next(ApiError.internal('Internal server error'));
        }
    }
    
    async addCategory(req, res, next) {
            try {
                const { nameOfCategory, existingImageId, imageName, imageUrl } = req.body;

                console.log('imageUrl:', imageUrl, 'existingImageId:', existingImageId, 'nameOfCategory:', nameOfCategory, 'imageName:', imageName);
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
// const { SubCategory, Category, Image, CategoryImage } = require('../models/models')
// const ApiError = require('../error/ApiError')
// const admin = require('firebase-admin');

// const fs = require('fs');
// const path = require('path');
// const sharp = require('sharp');
// const fsPromises = require('fs').promises;
// const verifyAdminToken = require('../utils/users/verifyAdminToken')

// class CategoriesController {
//     // CATEGORIES
//     async getCategories(req, res, next){
//         try {
//             const categories = await Category.findAll({
//                 include: [{
//                   model: Image,
//                   as: 'images',
//                   through: { attributes: [] },
//                   attributes: ['imgName', 'imgSrc'],
//                 }]
//             });

//             categories.forEach(category => {
//                     category.images.forEach(image => {
//                     image.imgSrc = `http://${req.headers.host}/${image.imgSrc.replace('static\\', '').replace(/\\/g, '/')}`;
//                 });
//             });  

//             return res.json(categories);
//         } catch (error) {
//             console.error('Error fetching categories:', error);
//             next(ApiError.internal('Internal server error'));
//         }
//     }
    
//     async addCategory(req, res, next) {
//         try {
//             verifyAdminToken(req);
//         } catch (error) {
//             return res.status(403).json({ error: 'Invalid admin token' });
//         }
        
//             uploadCategory.single('file')(req, res, async function(err) {
//             const existingImageId = req.body.iconId;

//             if (err) {
//                 console.error(err);
//                 return res.status(500).send('Something broke!');
//             }
            
//             try {
//                 const nameOfCategory = req.body.nameOfCategory;

//                 const category = await Category.create({
//                     name: nameOfCategory,
//                 });

//                 let imageId;

//                 if (existingImageId && existingImageId !== "undefined") { // "undefined" because existingImageId is a string
//                     imageId = existingImageId;
//                 } else if (req.file) {
//                     const file = req.file;

//                     if (!file) {
//                         return res.status(400).json({ error: 'No file uploaded' });
//                     }
                    
//                     let image = await Image.findOne({ where: { imgName: file.filename } });

//                     try {
//                         image = await Image.create({
//                             imgName: file.filename,
//                             imgSrc: file.path,
//                             imageableType: 'category',
//                         });
//                     } catch (error) {
//                         console.error('Error creating image:', error);
//                         return res.status(500).send('Error creating image');
//                     }

//                     imageId = image.id;
//                 } else {
//                     return res.status(400).json({ error: 'No file uploaded or existing image provided' });
//                 }

//                 await CategoryImage.create({ categoryId: category.id, imageId: imageId });

//                 return res.json({ message: 'Category uploaded successfully', category });
//             } catch (err) {
//                 console.error(err);
//                 return res.status(500).send('Error creating category');
//             }
//             });
//     };



//     async deleteImgCategory(req, res) {
//         try {
//             await verifyAdminToken(req);

//             const { id } = req.params;

//             const image = await Image.findByPk(id);
    
//             if (image) {
//                 const categoryImage = await CategoryImage.findOne({ where: { imageId: id } });

//                 if (categoryImage) {
//                     await categoryImage.destroy();
//                 }
    
//                 await image.destroy();
    
//                 fs.unlink(path.join(__dirname, '../', image.imgSrc), err => {
//                     if (err) {
//                         console.error('Error deleting file:', err);
//                         return res.status(500).json({ message: 'Error deleting file' });
//                     }
    
//                     return res.json({ message: 'Icon and associated category deleted successfully' });
//                 });
//             } else {
//                 return res.status(404).json({ message: 'Icon not found' });
//             }
//         } catch (error) {
//             console.error('Error deleting category:', error);
//             return res.status(500).json({ message: 'Internal server error' });
//         }
//     }
//     async deleteCategory(req, res) {
//         try {
//             await verifyAdminToken(req);

//             const { id } = req.params;

//             const category = await Category.findByPk(id);
    
//             if (category) {
//                 const categoryImages = await CategoryImage.findAll({ where: { categoryId: id } });
    
//                 for (let categoryImage of categoryImages) {
//                     await categoryImage.destroy();
//                 }
//                 await category.destroy();
    
//                 return res.json({ message: 'Category and associated icons deleted successfully' });
//             } else {
//                 return res.status(404).json({ message: 'Icon not found' });
//             }
//         } catch (error) {
//             console.error('Error deleting category:', error);
//             return res.status(500).json({ message: 'Internal server error' });
//         }
//     }

//     async getCategoriesIcons(req, res) {
//         try {
//             await verifyAdminToken(req);

//             const images = await Image.findAll({
//                 where: { imageableType: 'category' }
//             });

//             const icons = images.map(image => {

//                 const url = `http://${req.headers.host}/${image.imgSrc.replace('static\\', '').replace(/\\/g, '/')}`;

//                 return {
//                     id: image.id,
//                     fileName: image.imgName,
//                     fileUrl: url,
//                 };
//             });

//             return res.json(icons);

//         } catch (error) {
//             console.error('Error deleting user:', error);
//             return res.status(500).json({ message: 'Internal server error' });
//         }
//     }
//     async getCategoriesNameId(req, res) {
//         try {
//             await verifyAdminToken(req);

//             const categories = await Category.findAll({
//                 attributes: ['id', 'name']
//             });

//             return res.json(categories);

//         } catch (error) {
//             console.error('Error getting categories:', error);
//             return res.status(500).json({ message: 'Internal server error' });
//         }
//     }
// }

// module.exports = new CategoriesController()