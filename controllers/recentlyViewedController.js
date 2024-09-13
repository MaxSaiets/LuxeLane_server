const { RecentlyViewedList, RecentlyViewedItem } = require('../models/models');

const { getDetailedProductsInfoWithBasketAndFavorites } = require('./commonFunctions/commonControllerFunctions');

class RecentlyViewedController {
    async addRecentlyViewedProduct(req, res) {
        try {
            let { productId } = req.body;

            const userId = req.user.id;

            const [recentlyViewedList] = await RecentlyViewedList.findOrCreate({
                where: { userId: userId }
            });

            const recentlyViewedProduct = await RecentlyViewedItem.create({
                productId: productId,
                recentlyViewedListId: recentlyViewedList.id
            });

            const [detailedItem] = await getDetailedProductsInfoWithBasketAndFavorites({
                productsItems: [recentlyViewedProduct],
                userId: userId,
                imgsCount: 1
            });         

            return res.json(detailedItem);
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error adding product to recently viewed: ' + err.message);
        }
    }

    async getRecentlyViewedProducts(req, res) {
        try {
            const userId = req.user.id;

            const recentlyViewedList = await RecentlyViewedList.findOne({
                where: { userId },
                include: [RecentlyViewedItem]
            });

            if (!recentlyViewedList) {
                return res.json({ recentlyViewedList: [] });
            }

            const detailedItems = await getDetailedProductsInfoWithBasketAndFavorites({productsItems: recentlyViewedList.recently_viewed_items, userId: userId, imgsCount: 1});

            return res.json({recentlyViewedList: detailedItems});
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error fetching recently viewed products: ' + err.message);
        } 
    }

    async removeRecentlyViewedProduct(req, res) {
        try {
            let { productId, recentlyViewedListId } = req.body;
            const userId = req.user.id;

            const recentlyViewedList = await RecentlyViewedList.findOne({
                where: {
                    id: recentlyViewedListId,
                    userId
                }
            });

            if (!recentlyViewedList) {
                return res.status(404).json({ message: 'Recently viewed list not found' });
            }

            const recentlyViewedItem = await RecentlyViewedItem.findOne({
                where: {
                    productId,
                    recentlyViewedListId: recentlyViewedList.id
                }
            });

            if (!recentlyViewedItem) {
                return res.status(404).json({ message: 'Recently viewed item not found' });
            }

            await recentlyViewedItem.destroy();

            return res.json({ message: 'Recently viewed item removed successfully' });
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error removing product from recently viewed: ' + err.message);
        }
    }

    async removeRecentlyViewedList(req, res) {
        try {
            let { productId, recentlyViewedListId } = req.body;
            const userId = req.user.id;
            const recentlyViewedList = await RecentlyViewedList.findOne({
                where: {
                    id: recentlyViewedListId,
                    userId
                }
            });

            if (!recentlyViewedList) {
                return res.status(404).json({ message: 'Recently viewed list not found' });
            }

            const recentlyViewedItem = await RecentlyViewedItem.findOne({
                where: {
                    productId,
                    recentlyViewedListId: recentlyViewedList.id
                }
            });

            if (!recentlyViewedItem) {
                return res.status(404).json({ message: 'Recently viewed item not found' });
            }

            await recentlyViewedItem.destroy();

            return res.json({ message: 'Recently viewed item removed successfully' });
        } catch (err) {
            console.error(err);
            return res.status(500).send('Error removing product from recently viewed: ' + err.message);
        }
    }
}

module.exports = new RecentlyViewedController();