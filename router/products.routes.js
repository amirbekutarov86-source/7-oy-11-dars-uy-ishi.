const router = require("express").Router();
const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} = require("../controller/products.controller");
const { protect, adminOnly } = require("../middleware/auth");
const upload = require("../middleware/upload");

// Hamma uchun ochiq
router.get("/", getProducts);
router.get("/:id", getProduct);

// Faqat admin (rasm "image" nomli maydonda yuboriladi)
router.post("/", protect, adminOnly, upload.single("image"), createProduct);
router.put("/:id", protect, adminOnly, upload.single("image"), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
