const sampleListings = [
  {
    title: "MacBook Pro 2020",
    description: "Lightly used MacBook Pro, 13-inch, 16GB RAM, 512GB SSD.",
    price: "450000.00",
    categoryId: 6, // Electronics
    sellerId: 4,
    campusId: 4,
    condition: "used",
    images: [
      {
        url: "https://res.cloudinary.com/demo/macbook1.webp",
        publicId: "macbook1",
      },
      {
        url: "https://res.cloudinary.com/demo/macbook2.webp",
        publicId: "macbook2",
      },
      {
        url: "https://res.cloudinary.com/demo/macbook3.webp",
        publicId: "macbook3",
      },
    ],
  },
  {
    title: "Samsung Galaxy S21",
    description:
      "Brand new, 128GB, Phantom Gray, includes charger and earphones.",
    price: "180000.00",
    categoryId: 6, // Electronics
    sellerId: 3,
    campusId: 2,
    condition: "brand_new",
    images: [
      { url: "https://res.cloudinary.com/demo/s21_1.webp", publicId: "s21_1" },
      { url: "https://res.cloudinary.com/demo/s21_2.webp", publicId: "s21_2" },
    ],
  },
  {
    title: "Office Chair",
    description:
      "Comfortable ergonomic office chair, black color, good condition.",
    price: "25000.00",
    categoryId: 3, // Furniture
    sellerId: 4,
    campusId: 6,
    condition: "used",
    images: [
      {
        url: "https://res.cloudinary.com/demo/chair1.webp",
        publicId: "chair1",
      },
      {
        url: "https://res.cloudinary.com/demo/chair2.webp",
        publicId: "chair2",
      },
    ],
  },
  {
    title: "Electric Guitar",
    description: "Fender-style electric guitar, barely used, comes with strap.",
    price: "75000.00",
    categoryId: 6, // Musical instruments
    sellerId: 4,
    campusId: 2,
    condition: "used",
    images: [
      {
        url: "https://res.cloudinary.com/demo/guitar1.webp",
        publicId: "guitar1",
      },
      {
        url: "https://res.cloudinary.com/demo/guitar2.webp",
        publicId: "guitar2",
      },
      {
        url: "https://res.cloudinary.com/demo/guitar3.webp",
        publicId: "guitar3",
      },
    ],
  },
  {
    title: "Nike Sneakers",
    description: "Brand new Nike Air Max, size 42, red and black.",
    price: "40000.00",
    categoryId: 2, // Fashion
    sellerId: 4,
    campusId: 9,
    condition: "brand_new",
    images: [
      { url: "https://res.cloudinary.com/demo/nike1.webp", publicId: "nike1" },
      { url: "https://res.cloudinary.com/demo/nike2.webp", publicId: "nike2" },
    ],
  },
  {
    title: "Dell Monitor 24-inch",
    description:
      "Full HD monitor, good condition, perfect for gaming or office.",
    price: "65000.00",
    categoryId: 6, // Electronics
    sellerId: 3,
    campusId: 10,
    condition: "used",
    images: [
      {
        url: "https://res.cloudinary.com/demo/monitor1.webp",
        publicId: "monitor1",
      },
      {
        url: "https://res.cloudinary.com/demo/monitor2.webp",
        publicId: "monitor2",
      },
    ],
  },
  {
    title: "Textbooks Bundle",
    description:
      "Set of 5 university textbooks: Math, Physics, Chemistry, Economics, English.",
    price: "12000.00",
    categoryId: 4, // Books
    sellerId: 4,
    campusId: 2,
    condition: "used",
    images: [
      {
        url: "https://res.cloudinary.com/demo/books1.webp",
        publicId: "books1",
      },
      {
        url: "https://res.cloudinary.com/demo/books2.webp",
        publicId: "books2",
      },
    ],
  },
  {
    title: "Gaming Keyboard",
    description: "Mechanical RGB keyboard, barely used, fast response keys.",
    price: "20000.00",
    categoryId: 6, // Electronics
    sellerId: 4,
    campusId: 6,
    condition: "used",
    images: [
      {
        url: "https://res.cloudinary.com/demo/keyboard1.webp",
        publicId: "keyboard1",
      },
      {
        url: "https://res.cloudinary.com/demo/keyboard2.webp",
        publicId: "keyboard2",
      },
    ],
  },
  {
    title: "Bluetooth Headphones",
    description: "Over-ear headphones, noise-canceling, new in box.",
    price: "25000.00",
    categoryId: 6, // Electronics
    sellerId: 4,
    campusId: 6,
    condition: "brand_new",
    images: [
      {
        url: "https://res.cloudinary.com/demo/headphones1.webp",
        publicId: "headphones1",
      },
      {
        url: "https://res.cloudinary.com/demo/headphones2.webp",
        publicId: "headphones2",
      },
    ],
  },

  {
    title: "Backpack",
    description: "Durable laptop backpack, fits 15-inch laptops, black color.",
    price: "15000.00",
    categoryId: 2, // Fashion
    sellerId: 3,
    campusId: 2,
    condition: "brand_new",
    images: [
      {
        url: "https://res.cloudinary.com/demo/backpack1.webp",
        publicId: "backpack1",
      },
      {
        url: "https://res.cloudinary.com/demo/backpack2.webp",
        publicId: "backpack2",
      },
    ],
  },
];

export default sampleListings;
