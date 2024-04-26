const { SubCategory, Category, Image, SubCategoryImage } = require('../models/models')
const ApiError = require('../error/ApiError')

const fs = require('fs');
const path = require('path');

const { uploadSubCategory } = require('../multerConfig')

class SubCategoriesController {
    
    async deleteImgSubCategory(req, res) {
        try {

            const { id } = req.params;

            const image = await Image.findByPk(id);
    
            if (image) {
                const subCategoryImage = await SubCategoryImage.findOne({ where: { imageId: id } });

                if (subCategoryImage) {
                    await subCategoryImage.destroy();
                }

                await image.destroy();
    
                return res.json({ message: 'Icon and associated category deleted successfully' });
            } else {
                return res.status(404).json({ message: 'Icon not found' });
            }
        } catch (error) {
            console.error('Error deleting subCategory img:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getSubCategoriesIcons(req, res) {
        try {

            const images = await Image.findAll({
                where: { imageableType: 'subCategory' }
            });

            return res.json(images);
        } catch (error) {
            console.error('Error deleting subCategory icon:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getSubCategories(req, res, next){
        try {
            const subCategories = await SubCategory.findAll({
                include: [{
                    model: Category,
                    as: 'category',
                    attributes: ['id', 'name'],
                },{
                    model: Image,
                    as: 'images',
                    through: { attributes: [] },
                    attributes: ['id', 'imgName', 'imgSrc'],
                }]
            });

            return res.json(subCategories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            next(ApiError.internal('Internal server error'));
        }
    }
    async addSubCategories(req, res, next) {
        try {
            const { nameOfSubCategory, existingImageId, subCategoryId,  imageName, imageUrl } = req.body;

            const subCategory = await SubCategory.create({
                name: nameOfSubCategory,
                categoryId: subCategoryId
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
                        imageableType: 'subCategory',
                    });
                } catch (error) {
                    console.error('Error creating image:', error);
                    return res.status(500).send('Error creating image');
                }
    
                imageId = image.id;
            } else {
                return res.status(400).json({ error: 'No image URL provided or existing image provided' });
            }
    
            await SubCategoryImage.create({ subCategoryId: subCategory.id, imageId: imageId });
    
            return res.json({ message: 'Category uploaded successfully', subCategory });
        } catch (error) {
            console.error("ERROR WITH ADD SUBCATEGORY", error);
    
            return res.status(500).json({error: error.message});
        }
    }

    async deleteSubCategory(req, res, next) {
        try {
            const { id } = req.params;

            const subCategory = await SubCategory.findByPk(id);
    
            if (subCategory) {
                const subCategoryImages = await SubCategoryImage.findAll({ where: { subCategoryId: id } });
    
                for (let subCategoryImage of subCategoryImages) {
                    const image = await Image.findByPk(subCategoryImage.imageId);
                    if (image) {
                        await image.destroy();
                    }
                    await subCategoryImage.destroy();
                }
                await subCategory.destroy();
    
                return res.json({ message: 'SubCategory and associated icons deleted successfully' });
            } else {
                return res.status(404).json({ message: 'Icon not found' });
            }
        } catch (error) {
            console.error('Error deleting subcategory:', error);
            next(ApiError.internal('Internal server error'));
        }
    }

    async updateSubCategory(req, res, next) {
        try {
            // id and subCategoryId are the same
            // categoryId is the new category id
            // existingCategoryId is the old category id

            const { id } = req.params;
            const { name, categoryId, existingCategoryId, existingImageId, imageName, imageUrl, subCategoryId } = req.body;
            
            const subCategory = await SubCategory.findByPk(id);
            
            if (!subCategory) {
                throw ApiError.badRequest(`SubCategory with id ${subCategoryId} not found`);
            }
    
            if (categoryId) {
                subCategory.categoryId = categoryId;
            }

            if (name) {
                subCategory.name = name;
            }
    
            await subCategory.save();
    
            if (imageUrl && imageName) {
                const images = await subCategory.getImages();
               
                if (images && images.length > 0) {
                    const image = images[0];
                    image.imgName = imageName;
                    image.imgSrc = imageUrl;
                    
                    await image.save();
                } else {
                    console.error(`Image with id ${existingImageId} not found`);
                }
            }
            
            return res.json(subCategory);
        } catch (error) {
          console.error('Error updating subCategory:', error);
          return next(ApiError.badRequest(error.message));
        }
    }
}

module.exports = new SubCategoriesController()

// const { SubCategory, Category, Image, SubCategoryImage } = require('../models/models')
// const ApiError = require('../error/ApiError')

// const fs = require('fs');
// const path = require('path');
// const verifyAdminToken = require('../utils/users/verifyAdminToken')

// const { uploadSubCategory } = require('../multerConfig')

// class SubCategoriesController {
    
//     async deleteImgSubCategory(req, res) {
//         try {
//             await verifyAdminToken(req);

//             const { id } = req.params;

//             const image = await Image.findByPk(id);
    
//             if (image) {
//                 const subCategoryImage = await SubCategoryImage.findOne({ where: { imageId: id } });

//                 if (subCategoryImage) {
//                     await subCategoryImage.destroy();
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
//             console.error('Error deleting subCategory img:', error);
//             return res.status(500).json({ message: 'Internal server error' });
//         }
//     }

//     async getSubCategoriesIcons(req, res) {
//         try {
//             await verifyAdminToken(req);

//             const images = await Image.findAll({
//                 where: { imageableType: 'subCategory' }
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
//             console.error('Error deleting subCategory icon:', error);
//             return res.status(500).json({ message: 'Internal server error' });
//         }
//     }

//     async getSubCategories(req, res, next){
//         try {
//             const subCategories = await SubCategory.findAll({
//                 include: [{
//                     model: Category,
//                     as: 'category',
//                     attributes: ['name'],
//                 },{
//                     model: Image,
//                     as: 'images',
//                     through: { attributes: [] },
//                     attributes: ['imgName', 'imgSrc'],
//                 }]
//             });
//             subCategories.forEach(subCategory => {
//                 subCategory.images.forEach(image => {
//                 image.imgSrc = `http://${req.headers.host}/${image.imgSrc.replace('static\\', '').replace(/\\/g, '/')}`;
//             });
//         }); 

//             return res.json(subCategories);
//         } catch (error) {
//             console.error('Error fetching categories:', error);
//             next(ApiError.internal('Internal server error'));
//         }
//     }
//     async addSubCategories(req, res, next) {
//         try {
//             verifyAdminToken(req);
//         } catch (error) {
//             return res.status(403).json({ error: 'Invalid admin token' });
//         }

//         try {
//             uploadSubCategory.single('file')(req, res, async function(err) {
//                 const existingImageId = req.body.iconId;

//                 if (err) {
//                     console.error(err);
//                     return res.status(500).send('Something broke!');
//                 }
//                 const nameOfSubCategory = req.body.nameOfSubCategory;
//                 const subCategoryId = req.body.subCategoryId;

//                 const subCategory = await SubCategory.create({
//                     name: nameOfSubCategory,
//                     categoryId: subCategoryId
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
//                             imageableType: 'subCategory',
//                         });
//                     } catch (error) {
//                         console.error('Error creating image:', error);
//                         return res.status(500).send('Error creating image');
//                     }
    
//                         imageId = image.id;
//                     } else {
//                         return res.status(400).json({ error: 'No file uploaded or existing image provided' });
//                     }
    
//                 await SubCategoryImage.create({ subCategoryId: subCategory.id, imageId: imageId });
    
//                 return res.json({ message: 'Category uploaded successfully', subCategory });
//             });

//         } catch (error) {
//             console.error("ERROR WITH ADD SUBCATEGORY", error);
  
//             return res.status(500).json({error: error.message});
//         }
//     }
//     async deleteSubCategory(req, res, next) {
//         try {
//             await verifyAdminToken(req);

//             const { id } = req.params;

//             const subCategory = await SubCategory.findByPk(id);
    
//             if (subCategory) {
//                 const subCategoryImages = await SubCategoryImage.findAll({ where: { subCategoryId: id } });
    
//                 for (let subCategoryImage of subCategoryImages) {
//                     await subCategoryImage.destroy();
//                 }
//                 await subCategory.destroy();
    
//                 return res.json({ message: 'SubCategory and associated icons deleted successfully' });
//             } else {
//                 return res.status(404).json({ message: 'Icon not found' });
//             }
//         } catch (error) {
//             console.error('Error deleting subcategory:', error);
//             next(ApiError.internal('Internal server error'));
//         }
//     }
//     async updateSubCategory(req, res, next){
//         try {
//             await verifyAdminToken(req);

//             const { id } = req.params;
//             const { name, categoryId } = req.body;

//             const subCategory = await SubCategory.findByPk(id);
//             if (subCategory) {
//                 subCategory.name = name;
//                 subCategory.categoryId = categoryId;
//                 await subCategory.save();
//                 return res.json(subCategory);
//             } else {
//                 return res.status(404).json({ message: 'SubCategory not found' });
//             }
//         } catch (error) {
//             console.error('Error updating subcategory:', error);
//             next(ApiError.internal('Internal server error'));
//         }
//     }
// }

// module.exports = new SubCategoriesController()