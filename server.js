require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./router/auth.routes");
const categoryRoutes = require("./router/category.routes");
const productRoutes = require("./router/products.routes");
const cartRoutes = require("./router/cart.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rasmlar brauzer/Postman orqali ochiladi: http://localhost:4001/uploads/xxx.png
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({ message: "Mini dokon API ishlayapti 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Route topilmadi" });
});

// Xatolarni ushlash
app.use((err, req, res, next) => {
  if (err.name === "MulterError") {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Rasm hajmi 5 MB dan oshmasligi kerak"
        : err.message;
    return res.status(400).json({ message });
  }
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Server xatosi" });
});

const PORT = process.env.PORT || 4001;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlayapti`));
});
