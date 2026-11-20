// Namuna ma'lumotlarni bazaga qo'shish:  npm run seed
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Category = require("./model/category.model");
const Product = require("./model/products.model");

const data = [
  {
    category: "Tabiat",
    products: [
      { name: "Tong nurlari", price: 15000, stock: 20, image: "/uploads/1795015640035.png", description: "Tong paytidagi qarag'ay o'rmoni" },
      { name: "Park kechqurun", price: 18000, stock: 15, image: "/uploads/1795015652431.png", description: "Quyosh botayotgan yashil park" },
      { name: "Yashil maysazor", price: 12000, stock: 30, image: "/uploads/1795015659123.png", description: "Quyosh nurida yashil maysazor" },
      { name: "Qora qumtepa", price: 22000, stock: 10, image: "/uploads/1795015693759.png", description: "Qora cho'l qumtepalari" },
    ],
  },
  {
    category: "Neon dizayn",
    products: [
      { name: "Neon kvadratlar", price: 25000, stock: 25, image: "/uploads/1795015668920.png", description: "Rangli yaltiroq kvadratlar" },
      { name: "Neon qora fon", price: 28000, stock: 12, image: "/uploads/1795015675899.png", description: "Qora fondagi pushti va ko'k neon" },
    ],
  },
];

(async () => {
  await connectDB();

  // Eski namuna (olma, banan, sut, non) mahsulotlarini tozalash
  const old = await Product.deleteMany({ image: /^\/uploads\/namuna-/ });
  if (old.deletedCount) console.log(`- ${old.deletedCount} ta eski namuna mahsulot o'chirildi`);
  for (const name of ["Mevalar", "Sut mahsulotlari", "Non mahsulotlari"]) {
    const c = await Category.findOne({ name });
    if (c && (await Product.countDocuments({ category: c._id })) === 0) await c.deleteOne();
  }

  for (const group of data) {
    let category = await Category.findOne({ name: group.category });
    if (!category) category = await Category.create({ name: group.category });

    for (const p of group.products) {
      const exists = await Product.findOne({ name: p.name, category: category._id });
      if (!exists) {
        await Product.create({ ...p, category: category._id });
        console.log(`+ ${p.name}`);
      }
    }
  }

  console.log("Seed tugadi");
  await mongoose.disconnect();
})();
