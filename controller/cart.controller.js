const mongoose = require("mongoose");
const Cart = require("../model/cart.model");
const Product = require("../model/products.model");

// Foydalanuvchining savatini olish (yo'q bo'lsa yaratadi)
const getOrCreateCart = (userId) =>
  Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true }
  );

// Savatni mahsulot ma'lumotlari, subtotal va umumiy narx bilan qaytarish
const buildCart = async (req, cart) => {
  const ids = cart.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } }).select(
    "name price image stock"
  );
  const map = new Map(products.map((p) => [String(p._id), p]));

  // Bazadan o'chirilgan mahsulotlarni savatdan olib tashlaymiz
  const valid = cart.items.filter((i) => map.has(String(i.product)));
  if (valid.length !== cart.items.length) {
    cart.items = valid;
    await cart.save();
  }

  const host = `${req.protocol}://${req.get("host")}`;
  const items = cart.items.map((i) => {
    const p = map.get(String(i.product));
    return {
      product: {
        id: p._id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: p.image,
        imageUrl: p.image ? `${host}${p.image}` : "",
      },
      quantity: i.quantity,
      subtotal: p.price * i.quantity,
    };
  });

  return {
    id: cart._id,
    items,
    totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.subtotal, 0),
  };
};

const parseQuantity = (value, fallback) => {
  const q = value === undefined ? fallback : Number(value);
  return Number.isInteger(q) && q >= 1 ? q : null;
};

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json(await buildCart(req, cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/cart   body: { productId, quantity }
exports.addToCart = async (req, res) => {
  try {
    const { productId } = req.body;
    const quantity = parseQuantity(req.body.quantity, 1);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "productId noto'g'ri" });
    }
    if (!quantity) {
      return res.status(400).json({ message: "quantity 1 yoki undan katta butun son bo'lishi kerak" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });
    if (product.stock < 1) return res.status(400).json({ message: "Mahsulot tugagan" });

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => String(i.product) === String(productId));
    const newQty = (item ? item.quantity : 0) + quantity;

    if (newQty > product.stock) {
      return res.status(400).json({ message: `Omborda faqat ${product.stock} ta mavjud` });
    }

    if (item) item.quantity = newQty;
    else cart.items.push({ product: productId, quantity });

    await cart.save();
    res.status(201).json(await buildCart(req, cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/cart/:productId   body: { quantity }
exports.updateQuantity = async (req, res) => {
  try {
    const { productId } = req.params;
    const quantity = parseQuantity(req.body.quantity);

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "productId noto'g'ri" });
    }
    if (!quantity) {
      return res.status(400).json({ message: "quantity 1 yoki undan katta butun son bo'lishi kerak" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => String(i.product) === String(productId));
    if (!item) return res.status(404).json({ message: "Bu mahsulot savatda yo'q" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });
    if (quantity > product.stock) {
      return res.status(400).json({ message: `Omborda faqat ${product.stock} ta mavjud` });
    }

    item.quantity = quantity;
    await cart.save();
    res.json(await buildCart(req, cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart/:productId
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "productId noto'g'ri" });
    }

    const cart = await getOrCreateCart(req.user._id);
    const before = cart.items.length;
    cart.items = cart.items.filter((i) => String(i.product) !== String(productId));

    if (cart.items.length === before) {
      return res.status(404).json({ message: "Bu mahsulot savatda yo'q" });
    }

    await cart.save();
    res.json(await buildCart(req, cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/cart   (savatni tozalash)
exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json(await buildCart(req, cart));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
