const router = require("express").Router();
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} = require("../controller/cart.controller");
const { verifyToken, checkRole } = require("../middleware/auth");

// Savat faqat tizimga kirgan foydalanuvchilar uchun
router.use(verifyToken, checkRole("user", "admin"));

router.get("/", getCart);
router.post("/", addToCart);
router.delete("/", clearCart);
router.put("/:productId", updateQuantity);
router.delete("/:productId", removeFromCart);

module.exports = router;
