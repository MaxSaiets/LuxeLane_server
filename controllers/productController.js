const {Product, Category, SubCategory, Type, Brand, Image, ProductSubCategory, ProductBrand, ProductImage} = require('../models/models')
const ApiError = require('../error/ApiError')
const { uploadProduct } = require('../multerConfig')
const { Op } = require('sequelize');
const sequelize = require('../db');

class ProductController {
    async getAll(req, res) {
        // const productAssociations = Object.values(Product.associations);
        // console.log('Associations related to Product:');
        // productAssociations.forEach(association => {
        //     if (association.as && association.target && association.target.name && association.associationType) {
        //         console.log(`- Name: ${association.as}, Target: ${association.target.name}, Type: ${association.associationType}`);
        //     } else {
        //         console.log('Invalid association:', association);
        //     }
        // });
    
        try {
            const products = await Product.findAll({
                include: Object.values(Product.associations)
            })
    
            return res.json(products)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async create(req, res) {
        try { 
            let {title, price, categories, subCategories, types, brands, previewImageName, previewImageUrl, additionalImages} = req.body;

                const product = await Product.create({
                    title,
                    price,
                });
                
                const previewImage = await Image.create({
                    imgName: previewImageName,
                    imgSrc: previewImageUrl,
                    imageableType: 'productPreview',
                });
                  
                await ProductImage.create({ productId: product.id, imageId: previewImage.id });
                  
                if(additionalImages &&  Array.isArray(additionalImages)){
                    for (const imageFile of additionalImages) {
                        const image = await Image.create({
                            imgName: imageFile.name,
                            imgSrc: typeof imageFile.url === 'object' ? imageFile.url.url : imageFile.url,
                            imageableType: 'productImgAdditional',
                        });
                  
                        await ProductImage.create({ productId: product.id, imageId: image.id });
                    }
                }
        
              
                await product.addCategories(categories.map(category => category.id));
                await product.addSubCategories(subCategories.map(subCategory => subCategory.id));
                await product.addTypes(types.map(type => type.id));
                await product.addBrands(brands.map(brand => brand.id));
                
                return res.json({product});
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error creating product: ' + err.message);
        }
    }

    async delete(req, res) {
        try {
            const {id} = req.params
            const product = await Product.destroy({
                where: {id}
            })
            
            if (!product) {
                return res.status(404).json({error: 'Product not found'});
            }

            return res.json(product)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async update(req, res) {
        try {
            const {id} = req.params
            const {title, price, discount, categories, subCategories, types, brands, mainImage} = req.body

            const product = await Product.update({title, price, discount}, {
                where: {id}
            })

            await product.setCategories(categories)
            await product.setSubCategories(subCategories)
            await product.setTypes(types)
            await product.setBrands(brands)
            await product.setImage(mainImage)

            return res.json(product)
        } catch (error) {
            return res.status(500).json({error: error.message})
        }
    }

    async fetchProductsData(req, res) {
        // Associations related to Product:
        // - Name: basket_products, Target: basket_product, Type: HasMany
        // - Name: wish_products, Target: wish_product, Type: HasMany
        // - Name: orders, Target: order, Type: HasMany
        // - Name: ratings, Target: rating, Type: HasMany
        // - Name: reviews, Target: review, Type: HasMany
        // - Name: discountCard_for_products, Target: discountCard_for_product, Type: HasMany      
        // - Name: discounts, Target: discount, Type: HasMany
        // - Name: images, Target: image, Type: BelongsToMany
        // - Name: brands, Target: brand, Type: BelongsToMany
        // - Name: types, Target: type, Type: BelongsToMany
        // - Name: subCategories, Target: subCategory, Type: BelongsToMany
        // - Name: categories, Target: category, Type: BelongsToMany
        // - Name: product_infos, Target: product_info, Type: HasMany

        const { name, page = 1, brandsRequest, filters = {} } = req.body;
        const limit = 10;
        const offset = (page - 1) * limit;
        
        const sequelizeFilters = await convertFiltersToSequelize(filters);

        try {
            const subCategories = await SubCategory.findAll({ where: { name } });

            let totalProductsCount;
            let products;
            let minPrice;
            let maxPrice;
            let productBrands;
            let types;
            
            let allProducts;

            if (subCategories.length > 0) {
                products = await fetchProductsBySubCategory(subCategories, brandsRequest, limit, offset, sequelizeFilters);

                totalProductsCount = await countProducts(SubCategory, subCategories, sequelizeFilters);
                
                // Return all products
                allProducts = await fetchProductsBySubCategory(subCategories, brandsRequest, null, null, sequelizeFilters);
                
                ({ minPrice, maxPrice } = await fetchMinMaxPrice(SubCategory, subCategories));
            
            }  else {
                types = await Type.findAll({ where: { name } });
                products = await fetchProductsByType(types, brandsRequest, limit, offset, sequelizeFilters);
                totalProductsCount = await countProducts(Type, types, sequelizeFilters);

                // Return all products
                allProducts = await fetchProductsByType(types, null, null, null, sequelizeFilters);
                
                ({ minPrice, maxPrice } = await fetchMinMaxPrice(Type, types));            
            }


            productBrands = await fetchBrandsWithProductCount(sequelizeFilters, allProducts);

            // processProductImages(products, req.headers.host);
            
            const pageCount = Math.ceil(totalProductsCount / limit);
            
            return res.json({ products, totalProductsCount, minPrice, maxPrice, brands: productBrands, pageCount});
        } catch (error) {
            console.log("Error fetching products: ", error);
            return res.status(500).json({ error: error.message });
        }
    }
}
 
async function fetchProductsBySubCategory(subCategories, brands, limit, offset, sequelizeFilters) {
    
    const include = [
        { model: SubCategory, where: { id: subCategories.map(subCategory => subCategory.id) } },
        Type,
        Image
    ];

    if (Array.isArray(brands) && brands.length > 0) {
        include.push({ model: Brand, where: { name: { [Op.in]: brands } } });
    }
    
    return await Product.findAll({
        where: sequelizeFilters,
        include,
        limit,
        offset
    });
}
 
async function fetchProductsByType(types, brands, limit, offset, sequelizeFilters) {
    const include = [
        { model: Type, where: { id: types.map(type => type.id) } },
        SubCategory,
        Image
    ];

    if (Array.isArray(brands) && brands.length > 0) {
        include.push({ model: Brand, where: { name: { [Op.in]: brands } } });
    }

    return await Product.findAll({
        where: sequelizeFilters,
        include,
        limit,
        offset
    });
}

async function convertFiltersToSequelize(filters) {
    const sequelizeFilters = {};
    for (const key in filters) {
        const filter = filters[key];
        if (filter.between) {
            sequelizeFilters[key] = { [Op.between]: filter.between };
        }
        if (filter.gt) {
            sequelizeFilters[key] = { [Op.gt]: filter.gt };
        } 
        if (filter.gte) {
            sequelizeFilters[key] = { [Op.gte]: filter.gte };
        }
        if (filter.lt) {
            sequelizeFilters[key] = { [Op.lt]: filter.lt };
        }
        if (filter.lte) {
            sequelizeFilters[key] = { [Op.lte]: filter.lte };
        }
        if (filter.ne) {
            sequelizeFilters[key] = { [Op.ne]: filter.ne };
        }   
        if (filter.eq) { 
            sequelizeFilters[key] = { [Op.eq]: filter.eq };
        }
        if (filter.in) {
            sequelizeFilters[key] = { [Op.in]: filter.in };
        }
        if (filter.notIn) {
            sequelizeFilters[key] = { [Op.notIn]: filter.notIn };
        }
    }
    return sequelizeFilters;
}

async function countProducts(model, items, sequelizeFilters) {
    return await Product.count({
        where: sequelizeFilters,
        include: [{ model, where: { id: items.map(item => item.id) } }]
    });
}

async function fetchMinMaxPrice(Model, items) {
    try {
        const result = await Product.findAll({
            include: [{
                model: Model,
                where: { id: items.map(item => item.id) },
                through: { attributes: [] },
            }],
            attributes: [
                [sequelize.fn('min', sequelize.col('price')), 'minPrice'],
                [sequelize.fn('max', sequelize.col('price')), 'maxPrice'],
                `${Model.tableName}.id`
            ],
            group: [`${Model.tableName}.id`],
            raw: true,
        });

        return result[0];
    } catch (error) {
        console.error("Error fetch min and max price: ", error);
    }
}

async function fetchBrandsWithProductCount(sequelizeFilters, selectedProducts) {
    try {
        const brands = await Brand.findAll({
            include: [{ model: Product, where: sequelizeFilters }]
        });

        const brandsWithProductCount = {};

        for (let brand of brands) {
            const productCount = await ProductBrand.count({
                where: { 
                    brandId: brand.id,
                    productId: { [Op.in]: selectedProducts.map(product => product.id) }
                }
            });
            if (productCount > 0) {
                brandsWithProductCount[brand.name] = productCount;
            }
        }

        return brandsWithProductCount;
    } catch (error) {
        console.error("Помилка отримання кількості товарів для брендів: ", error);
        return {};
    }
}

// function processProductImages(products, host) {
//     products.forEach(product => {
//         product.images.sort((a, b) => b.imageableType.localeCompare(a.imageableType));
//         product.images.forEach(image => {
//             image.imgSrc = `http://${host}/${image.imgSrc.replace('static\\', '').replace(/\\/g, '/')}`;
//         });
//     });
// }

module.exports = new ProductController()