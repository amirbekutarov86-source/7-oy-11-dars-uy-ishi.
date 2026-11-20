const Category = require("../model/category.model");

// POST /api/categories  (admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: "Kategoriya nomi kerak" });

    const exists = await Category.findOne({ name });
    if (exists) return res.status(400).json({ message: "Bunday kategoriya mavjud" });

    const category = await Category.create({
      name,
      description,
      createdBy: req.user._id,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/categories/:id
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Kategoriya topilmadi" });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: "ID noto'g'ri" });
  }
};

// PUT /api/categories/:id  (admin)
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name, description: req.body.description },
      { new: true, runValidators: true }
    );
    if (!category) return res.status(404).json({ message: "Kategoriya topilmadi" });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/categories/:id  (admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ message: "Kategoriya topilmadi" });
    res.json({ message: "Kategoriya o'chirildi" });
  } catch (error) {
    res.status(400).json({ message: "ID noto'g'ri" });
  }
};
