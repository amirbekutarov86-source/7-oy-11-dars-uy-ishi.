const router = require("express").Router();
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/category.controller");
const { protect, adminOnly } = require("../middleware/auth");

router.get("/", getCategories);
router.get("/:id", getCategory);

router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;
