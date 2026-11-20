const jwt = require("jsonwebtoken");
const User = require("../model/auth.model");

// 1) TOKENNI TEKSHIRISH
// Headerdan "Authorization: Bearer <token>" ni oladi, tekshiradi va
// foydalanuvchini req.user ga qo'yadi.
const verifyToken = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Token topilmadi, avval tizimga kiring" });
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Foydalanuvchi topilmadi" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token muddati tugagan, qayta kiring" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Token yaroqsiz" });
    }
    res.status(500).json({ message: error.message });
  }
};

// 2) ROLNI TEKSHIRISH
// Ishlatilishi: checkRole("admin")  yoki  checkRole("user", "admin")
// Doim verifyToken dan KEYIN qo'yiladi.
const checkRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Avval tizimga kiring" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Ruxsat yo'q. Kerakli rol: ${roles.join(" yoki ")}`,
      });
    }
    next();
  };

module.exports = {
  verifyToken,
  checkRole,
  // eski nomlar (routerlar buzilmasligi uchun)
  protect: verifyToken,
  authorize: checkRole,
  adminOnly: checkRole("admin"),
};
