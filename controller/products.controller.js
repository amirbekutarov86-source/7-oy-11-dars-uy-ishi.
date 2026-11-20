const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Product = require("../model/products.model");
const Category = require("../model/category.model");

const uploadDir = path.join(__dirname, "..", "uploads");

// Rasmga to'liq URL qo'shish: http://localhost:4001/uploads/xxx.png
const format = (req, product) => {
  const obj = product.toObject ? product.toObject() : product;
  obj.imageUrl = obj.image ? `${req.protocol}://${req.get("host")}${obj.image}` : "";
  return obj;
};

// "/uploads/xxx.png" -> uploads papkasidan faylni o'chirish
const removeFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith("/uploads/")) return;
  const filePath = path.join(uploadDir, path.basename(imagePath));
  fs.unlink(filePath, () => {});
};

// Rasm boshqa mahsulotda ishlatilmasa o'chiramiz
const removeImageIfUnused = async (imagePath) => {
  if (!imagePath) return;
  const used = await Product.countDocuments({ image: imagePath });
  if (used === 0) removeFile(imagePath);
};

// POST /api/products   (admin)  -- form-data: name, price, category, description, stock, image(file)
exports.createProduct = async (req, res) => {
  const uploaded = req.file ? `/uploads/${req.file.filename}` : "";
  try {
    const { name, description, price, stock, category } = req.body;

    if (!name || price === undefined || !category) {
      removeFile(uploaded);
      return res.status(400).json({ message: "name, price va category kiritilishi shart" });
    }
    if (!mongoose.isValidObjectId(category) || !(await Category.findById(category))) {
      removeFile(uploaded);
      return res.status(400).json({ message: "Bunday kategoriya topilmadi" });
    }

    // Fayl yuklangan bo'lsa shuni, bo'lmasa body'dagi "image" (masalan /uploads/abc.png) ni olamiz
    const image = uploaded || req.body.image || "";

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      category,
      image,
      createdBy: req.user._id,
    });

    await product.populate("category", "name");
    res.status(201).json(format(req, product));
  } catch (error) {
    removeFile(uploaded);
    res.status(400).json({ message: error.message });
  }
};

// GET /api/products?search=&category=&minPrice=&maxPrice=&page=1&limit=10
exports.getProducts = async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice } = req.query;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (category) {
      if (!mongoose.isValidObjectId(category)) {
        return res.status(400).json({ message: "Kategoriya ID noto'g'ri" });
      }
      filter.category = category;
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      products: products.map((p) => format(req, p)),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID noto'g'ri" });
    }
    const product = await Product.findById(req.params.id).populate("category", "name");
    if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });
    res.json(format(req, product));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/products/:id   (admin)  -- yangi rasm yuborilsa eskisi almashadi
exports.updateProduct = async (req, res) => {
  const uploaded = req.file ? `/uploads/${req.file.filename}` : "";
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      removeFile(uploaded);
      return res.status(400).json({ message: "ID noto'g'ri" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      removeFile(uploaded);
      return res.status(404).json({ message: "Mahsulot topilmadi" });
    }

    const { name, description, price, stock, category } = req.body;

    if (category !== undefined) {
      if (!mongoose.isValidObjectId(category) || !(await Category.findById(category))) {
        removeFile(uploaded);
        return res.status(400).json({ message: "Bunday kategoriya topilmadi" });
      }
      product.category = category;
    }
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (stock !== undefined) product.stock = stock;

    const oldImage = product.image;
    if (uploaded) product.image = uploaded;
    else if (req.body.image !== undefined) product.image = req.body.image;

    await product.save();
    if (product.image !== oldImage) await removeImageIfUnused(oldImage);

    await product.populate("category", "name");
    res.json(format(req, product));
  } catch (error) {
    removeFile(uploaded);
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/products/:id   (admin)
exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "ID noto'g'ri" });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Mahsulot topilmadi" });

    await removeImageIfUnused(product.image);
    res.json({ message: "Mahsulot o'chirildi" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
