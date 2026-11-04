const MarketplaceCart = require('../models/MarketplaceCart');
const MarketplaceProduct = require('../models/MarketplaceProduct');

/**
 * Helper to get or create cart for user/expert
 */
async function getOrCreateCart(userId, userModel) {
  let cart = await MarketplaceCart.findOne({ userId, userModel }).populate({
    path: 'items.product',
    select: 'title slug coverImage price discountedPrice status sellerId sellerName sellerModel'
  });

  if (!cart) {
    cart = new MarketplaceCart({
      userId,
      userModel,
      items: []
    });
    await cart.save();
  }

  return cart;
}

/**
 * GET /api/marketplace/cart
 * Get user's cart contents and calculated totals
 */
exports.getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    const cart = await getOrCreateCart(userId, userModel);

    // Filter out products that were deleted or unapproved
    const validItems = cart.items.filter(item => item.product && item.product.status === 'APPROVED');
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    // Compute live prices and subtotal
    let subtotal = 0;
    const formattedItems = validItems.map(item => {
      const currentPrice = (item.product.discountedPrice != null && item.product.discountedPrice > 0)
        ? item.product.discountedPrice
        : item.product.price;
      subtotal += currentPrice;

      return {
        _id: item._id,
        product: {
          _id: item.product._id,
          title: item.product.title,
          slug: item.product.slug,
          coverImage: item.product.coverImage,
          price: item.product.price,
          discountedPrice: item.product.discountedPrice,
          sellerName: item.product.sellerName,
          sellerId: item.product.sellerId,
          sellerModel: item.product.sellerModel
        },
        unitPrice: currentPrice,
        addedAt: item.addedAt
      };
    });

    res.json({
      success: true,
      cart: {
        _id: cart._id,
        items: formattedItems,
        itemCount: formattedItems.length,
        subtotal,
        taxAmount: 0,
        totalAmount: subtotal
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve cart' });
  }
};

/**
 * POST /api/marketplace/cart/items
 * Add digital product to cart
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await MarketplaceProduct.findById(productId);
    if (!product || product.status !== 'APPROVED') {
      return res.status(404).json({ success: false, message: 'Digital product is not available for purchase' });
    }

    // Security check: cannot buy own product!
    if (product.sellerId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add or purchase your own digital product'
      });
    }

    const cart = await getOrCreateCart(userId, userModel);

    // Prevent duplicate entries
    const alreadyInCart = cart.items.some(
      item => item.product?._id?.toString() === productId || item.product?.toString() === productId
    );

    if (alreadyInCart) {
      return res.json({
        success: true,
        message: 'Product is already in your cart',
        cart
      });
    }

    const price = (product.discountedPrice != null && product.discountedPrice > 0)
      ? product.discountedPrice
      : product.price;

    cart.items.push({
      product: product._id,
      price,
      addedAt: new Date()
    });

    await cart.save();

    res.json({
      success: true,
      message: 'Product added to cart',
      itemCount: cart.items.length
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

/**
 * DELETE /api/marketplace/cart/items/:itemId
 * Remove item from cart
 */
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    const cart = await getOrCreateCart(userId, userModel);

    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId && item.product?.toString() !== itemId
    );

    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart',
      itemCount: cart.items.length
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ success: false, message: 'Failed to remove item from cart' });
  }
};

/**
 * DELETE /api/marketplace/cart
 * Clear entire cart
 */
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const userModel = req.userType === 'EXPERT' ? 'Expert' : 'User';

    await MarketplaceCart.findOneAndUpdate(
      { userId, userModel },
      { $set: { items: [] } }
    );

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ success: false, message: 'Failed to clear cart' });
  }
};

