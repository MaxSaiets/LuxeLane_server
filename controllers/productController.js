const {
    Product,
    Category,
    SubCategory,
    Type,
    Brand, 
    Image,
    ProductBrand,
    ProductImage,
    Basket,
    BasketItem,
    FavoriteList,
    FavoriteItem,
    RecentlyViewed,
} = require('../models/models');
const { Op } = require('sequelize');
const sequelize = require('../db');

class ProductController {
    async getAll(req, res) {
        try {
            const products = await Product.findAll({
                include: Object.values(Product.associations)
            });
            return res.json(products);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async getProductDataById(req, res) {
        const { id } = req.params;
        const userId = req.user?.id;

        try {
            const product = await Product.findOne({
                where: { id },
                include: [
                    {
                        model: Image,
                        as: 'images',
                        required: false,
                        attributes: ['imgName', 'imgSrc', 'imageableType'],
                        where: {
                            [Op.or]: [
                                { imageableType: 'productFullPreview' },
                                { imageableType: 'productFullBigPreview' },
                                { imageableType: 'productImgBigPreview' },
                                { imageableType: 'productBigImg' }
                            ]
                        },
                        order: [
                            ['imageableType', 'ASC'],
                            ['createdAt', 'ASC']
                        ]
                    },
                    Brand,
                    Type,
                    SubCategory,
                ]
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            let favoriteProductIds = [];
            let basketProductIds = [];

            if (userId) {
                const favoriteList = await FavoriteList.findOne({ where: { userId } });
                if (favoriteList) {
                    const favoriteItems = await FavoriteItem.findAll({ where: { favoriteListId: favoriteList.id } });
                    favoriteProductIds = favoriteItems.map(item => item.productId);
                }

                const basket = await Basket.findOne({ where: { userId } });
                if (basket) {
                    const basketItems = await BasketItem.findAll({ where: { basketId: basket.id } });
                    basketProductIds = basketItems.map(item => item.productId);
                }
            }

            const imageMap = {};
            product.images.forEach(image => {
                const { imgName, imgSrc, imageableType } = image;
                const validImgSrc = imgSrc || 'https://firebasestorage.googleapis.com/v0/b/reactmarket-79722.appspot.com/o/utils%2F404.png?alt=media&token=161921ed-2e18-4cec-acff-2f8a171abaeb';

                if (!imageMap[imgName]) {
                    imageMap[imgName] = {
                        imgName: imgName,
                        imgSrc: validImgSrc,
                        imgBigSrc: imageableType === 'productFullBigPreview' ? validImgSrc : 'https://firebasestorage.googleapis.com/v0/b/reactmarket-79722.appspot.com/o/utils%2F404.png?alt=media&token=161921ed-2e18-4cec-acff-2f8a171abaeb',
                    };
                } else {
                    if (imageableType === 'productBigImg' || imageableType === 'productFullBigPreview') {
                        imageMap[imgName].imgBigSrc = validImgSrc;
                    }
                }
            });

            const images = Object.values(imageMap);

            const productWithFlags = {
                id: product.id,
                code: product.code,
                title: product.title,
                price: product.price,
                images: images,
                isFavorite: favoriteProductIds.includes(product.id),
                isInBasket: basketProductIds.includes(product.id)
            };

            return res.json(productWithFlags);
        } catch (error) {
            console.error("Error fetching product data: ", error);
            return res.status(500).json({ error: error.message });
        }
    }

    async create(req, res) {
        try {
            let {
                title,
                price,
                categories,
                subCategories,
                types,
                brands,
                previewImageName,
                previewImageUrl,
                fullPreviewImageName,
                fullPreviewImageUrl,
                fullBigPreviewImageName,
                fullBigPreviewImageUrl,
                additionalImages,
            } = req.body;

            const product = await Product.create({
                title,
                price,
                code: await generateUniqueCode(),
            });

            const imageTypes = [
                { name: previewImageName, url: previewImageUrl, type: 'productPreview' },
                { name: fullPreviewImageName, url: fullPreviewImageUrl, type: 'productFullPreview' },
                { name: fullBigPreviewImageName, url: fullBigPreviewImageUrl, type: 'productFullBigPreview' }
            ];

            const imagePromises = imageTypes.map(({ name, url, type }) =>
                Image.create({ imgName: name, imgSrc: url, imageableType: type })
            );
            const images = await Promise.all(imagePromises);

            const productImagePromises = images.map(image => 
                ProductImage.create({ productId: product.id, imageId: image.id })
            );
            await Promise.all(productImagePromises);

            if (additionalImages && Array.isArray(additionalImages)) {
                const additionalImagePromises = additionalImages.map(imageFile => 
                    Promise.all([
                        Image.create({
                            imgName: imageFile.nameBigPreview,
                            imgSrc: imageFile.urlBigPreview,
                            imageableType: 'productImgBigPreview',
                        }),
                        Image.create({
                            imgName: imageFile.nameBigImg,
                            imgSrc: imageFile.urlBigImg,
                            imageableType: 'productBigImg',
                        })
                    ]).then(([bigPreview, bigImg]) => 
                        Promise.all([
                            ProductImage.create({ productId: product.id, imageId: bigPreview.id }),
                            ProductImage.create({ productId: product.id, imageId: bigImg.id })
                        ])
                    )
                );
                await Promise.all(additionalImagePromises);
            }

            await product.addCategories(categories.map(category => category.id));
            await product.addSubCategories(subCategories.map(subCategory => subCategory.id));
            await product.addTypes(types.map(type => type.id));
            await product.addBrands(brands.map(brand => brand.id));

            return res.json({ product });
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error creating product: ' + err.message);
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const product = await Product.destroy({
                where: { id }
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            return res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const { title, price, discount, categories, subCategories, types, brands, mainImage } = req.body;

            const [updated] = await Product.update({ title, price, discount }, {
                where: { id }
            });

            if (updated) {
                await Product.setCategories(categories.map(category => category.id));
                await Product.setSubCategories(subCategories.map(subCategory => subCategory.id));
                await Product.setTypes(types.map(type => type.id));
                await Product.setBrands(brands.map(brand => brand.id));
                await Product.setImage(mainImage);

                return res.json({ message: 'Product updated successfully' });
            }
            
            return res.status(404).json({ error: 'Product not found' });
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    async fetchProductsData(req, res) {
        const { name, page = 1, brandsRequest, filters = {} } = req.body;
        const userId = req.user?.id;
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
                allProducts = await fetchProductsBySubCategory(subCategories, null, null, null, sequelizeFilters);
                ({ minPrice, maxPrice } = await fetchMinMaxPrice(SubCategory, subCategories));
            } else {
                types = await Type.findAll({ where: { name } });
                products = await fetchProductsByType(types, brandsRequest, limit, offset, sequelizeFilters);
                totalProductsCount = await countProducts(Type, types, sequelizeFilters);
                allProducts = await fetchProductsByType(types, null, null, null, sequelizeFilters);
                ({ minPrice, maxPrice } = await fetchMinMaxPrice(Type, types));
            }

            productBrands = await Brand.findAll();
            return res.json({ 
                products, 
                totalProductsCount, 
                minPrice, 
                maxPrice, 
                productBrands, 
                types, 
                allProducts 
            });
        } catch (error) {
            console.error("Error fetching products data: ", error);
            return res.status(500).json({ error: error.message });
        }
    }
}

// Helper functions
async function generateUniqueCode() {
    const code = Math.floor(Math.random() * 1000000000).toString();
    const existingProduct = await Product.findOne({ where: { code } });
    return existingProduct ? generateUniqueCode() : code;
}

async function convertFiltersToSequelize(filters) {
    // Convert filters to Sequelize format
    const { priceMin, priceMax, brands, categories, types } = filters;
    let sequelizeFilters = {};
    if (priceMin) sequelizeFilters.price = { [Op.gte]: priceMin };
    if (priceMax) sequelizeFilters.price = { ...sequelizeFilters.price, [Op.lte]: priceMax };
    if (brands && brands.length) sequelizeFilters.brandId = { [Op.in]: brands };
    if (categories && categories.length) sequelizeFilters.categoryId = { [Op.in]: categories };
    if (types && types.length) sequelizeFilters.typeId = { [Op.in]: types };
    return sequelizeFilters;
}

async function fetchProductsBySubCategory(subCategories, brandsRequest, limit, offset, sequelizeFilters) {
    return Product.findAll({
        where: sequelizeFilters,
        include: [
            { model: SubCategory, where: { id: subCategories.map(sc => sc.id) } },
            { model: Brand, where: brandsRequest ? { id: brandsRequest } : {} }
        ],
        limit,
        offset
    });
}

async function fetchProductsByType(types, brandsRequest, limit, offset, sequelizeFilters) {
    return Product.findAll({
        where: sequelizeFilters,
        include: [
            { model: Type, where: { id: types.map(t => t.id) } },
            { model: Brand, where: brandsRequest ? { id: brandsRequest } : {} }
        ],
        limit,
        offset
    });
}

async function countProducts(model, items, sequelizeFilters) {
    return model.count({
        where: sequelizeFilters,
        include: [
            { model: model === SubCategory ? SubCategory : Type, where: { id: items.map(item => item.id) } }
        ]
    });
}

async function fetchMinMaxPrice(model, items) {
    const minMax = await Product.findAll({
        attributes: [
            [sequelize.fn('MIN', sequelize.col('price')), 'minPrice'],
            [sequelize.fn('MAX', sequelize.col('price')), 'maxPrice']
        ],
        include: [
            { model: model === SubCategory ? SubCategory : Type, where: { id: items.map(item => item.id) } }
        ]
    });
    return {
        minPrice: minMax[0]?.get('minPrice') || 0,
        maxPrice: minMax[0]?.get('maxPrice') || 0
    };
}

module.exports = new ProductController();
