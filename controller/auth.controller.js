const User = require("../model/auth.model");
const generateToken = require("../utils/generateToken");

const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Barcha maydonlarni to'ldiring" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Bu email band" });

    // Birinchi ro'yxatdan o'tgan foydalanuvchi admin bo'ladi
    const isFirst = (await User.countDocuments()) === 0;

    const user = await User.create({
      name,
      email,
      password,
      role: isFirst ? "admin" : "user",
    });

    res.status(201).json({ user: userResponse(user), token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email va parol kiriting" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Email yoki parol noto'g'ri" });
    }

    res.json({ user: userResponse(user), token: generateToken(user._id) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ user: userResponse(req.user) });
};
