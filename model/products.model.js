const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Mahsulot nomi kiritilishi shart"],
      trim: true,
    },
    description: { type: String, trim: true, default: "" },
    price: {
      type: Number,
      required: [true, "Narx kiritilishi shart"],
      min: [0, "Narx manfiy bo'lmasligi kerak"],
    },
    stock: { type: Number, default: 0, min: 0 },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Kategoriya tanlanishi shart"],
    },
    image: { type: String, default: "" }, // masalan: /uploads/1794908641705.png
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
