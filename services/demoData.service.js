const bcrypt = require('bcryptjs');

const demoUserSeed = {
  companyName: 'Tasty Bites Restaurant',
  ownerName: 'Rajesh Kumar',
  businessType: 'Restaurant',
  email: 'demo@billbro.in',
  password: 'Demo@123',
  gstNumber: '29ABCDE1234F1Z5',
  phone: '+91 98765 43210',
  address: '123 MG Road',
  city: 'Bangalore',
  state: 'Karnataka',
  pincode: '560001',
  upiId: 'tastybites@paytm',
  logo: 'https://via.placeholder.com/120',
};

const categorySeeds = {
  Punjabi: ['Butter Chicken', 'Paneer Tikka', 'Dal Makhani', 'Chole Bhature', 'Tandoori Chicken'],
  Gujarati: ['Gujarati Thali', 'Dhokla', 'Khandvi', 'Undhiyu', 'Fafda Jalebi'],
  'South Indian': ['Masala Dosa', 'Idli Sambhar', 'Medu Vada', 'Uttapam', 'Rava Dosa'],
  'North Indian': ['Rogan Josh', 'Korma', 'Aloo Dum', 'Dum Aloo', 'Nihari'],
  Chinese: ['Hakka Noodles', 'Fried Rice', 'Spring Rolls', 'Chilli Chicken', 'Manchurian'],
  Breakfast: ['Poha', 'Upma', 'Aloo Paratha', 'Puri Bhaji', 'Sabudana Khichdi'],
  Lunch: ['Veg Thali', 'Mini Thali', 'Paneer Lunch Box', 'Dal Rice Box', 'Executive Lunch'],
  Dinner: ['Family Dinner Pack', 'Dinner Thali', 'Veg Curry Plate', 'Chicken Dinner Box', 'Rice Combo'],
  'Main Course': ['Shahi Paneer', 'Chicken Curry', 'Veg Korma', 'Mutton Korma', 'Baingan Bharta'],
  Starter: ['Paneer Tikka', 'Chicken Wings', 'Fish Finger', 'Veg Spring Roll', 'Chicken Lollipop'],
  Soup: ['Tomato Soup', 'Sweet Corn Soup', 'Manchow Soup', 'Hot & Sour Soup', 'Mushroom Soup'],
  Snacks: ['Samosa', 'Pakora', 'Vada Pav', 'Pav Bhaji', 'Bhel Puri'],
  Beverages: ['Masala Chai', 'Filter Coffee', 'Lassi', 'Mango Lassi', 'Fresh Lime Soda'],
  Desserts: ['Gulab Jamun', 'Rasgulla', 'Jalebi', 'Kheer', 'Kulfi'],
  'Street Food': ['Pani Puri', 'Dahi Puri', 'Aloo Tikki', 'Ragda Pattice', 'Dabeli'],
  'Fast Food': ['Veg Burger', 'Chicken Burger', 'French Fries', 'Cheese Sandwich', 'Pizza Slice'],
  'Combo Meals': ['Veg Combo', 'Non-Veg Combo', 'South Indian Combo', 'Breakfast Combo', 'Student Special'],
  Rice: ['Jeera Rice', 'Veg Biryani', 'Chicken Biryani', 'Pulao', 'Curd Rice'],
  Roti: ['Tandoori Roti', 'Butter Naan', 'Garlic Naan', 'Laccha Paratha', 'Rumali Roti'],
  Sabji: ['Aloo Gobi', 'Bhindi Masala', 'Mix Veg', 'Veg Jalfrezi', 'Chana Masala'],
  Dal: ['Dal Tadka', 'Dal Fry', 'Moong Dal', 'Masoor Dal', 'Dal Makhani'],
  Sweets: ['Kaju Katli', 'Soan Papdi', 'Motichoor Ladoo', 'Besan Ladoo', 'Peda'],
};

const variants = ['Classic', 'Special', 'Signature', 'Royal', 'Family'];

function basePriceForCategory(category, index) {
  const categoryBase = {
    Punjabi: 240,
    Gujarati: 90,
    'South Indian': 85,
    'North Indian': 220,
    Chinese: 130,
    Breakfast: 55,
    Lunch: 160,
    Dinner: 180,
    'Main Course': 210,
    Starter: 150,
    Soup: 75,
    Snacks: 35,
    Beverages: 25,
    Desserts: 60,
    'Street Food': 45,
    'Fast Food': 70,
    'Combo Meals': 120,
    Rice: 95,
    Roti: 15,
    Sabji: 110,
    Dal: 100,
    Sweets: 70,
  };

  return (categoryBase[category] || 100) + index * 9;
}

function gstForCategory(category) {
  const highTax = new Set(['Beverages', 'Desserts', 'Sweets']);
  return highTax.has(category) ? 12 : 5;
}

function generateDemoProducts(ownerId) {
  const products = [];
  let counter = 1;

  for (const [category, baseNames] of Object.entries(categorySeeds)) {
    baseNames.forEach((baseName, baseIndex) => {
      variants.forEach((variant, variantIndex) => {
        products.push({
          name: `${baseName} ${variant}`.trim(),
          category,
          price: basePriceForCategory(category, baseIndex * variants.length + variantIndex),
          gstRate: gstForCategory(category),
          stock: 100 + counter,
          description: `${variant} ${baseName.toLowerCase()} prepared for ${category.toLowerCase()} service`,
          createdBy: ownerId,
        });
        counter += 1;
      });
    });
  }

  return products;
}

function generateDemoBuyers(ownerId) {
  return Array.from({ length: 40 }, (_, index) => ({
    name: `Customer ${index + 1}`,
    phone: `987654${String(1000 + index).slice(-4)}`,
    email: `customer${index + 1}@example.com`,
    address: `${index + 1}, Market Road`,
    totalPurchases: (index % 7) + 1,
    createdBy: ownerId,
  }));
}

function generateDemoBills(ownerId, buyerIds, productDocs) {
  const now = new Date();
  return Array.from({ length: 30 }, (_, index) => {
    const buyerId = buyerIds[index % buyerIds.length];
    const selectedProducts = [
      productDocs[(index * 3) % productDocs.length],
      productDocs[(index * 3 + 1) % productDocs.length],
    ];

    const items = selectedProducts.map((product, itemIndex) => {
      const quantity = itemIndex + 1;
      const base = product.price * quantity;
      const discount = itemIndex === 0 ? 0 : 5;
      const discounted = base - (base * discount) / 100;
      const gst = (discounted * product.gstRate) / 100;
      const split = product.gstRate / 2;
      return {
        productId: product._id,
        name: product.name,
        category: product.category,
        price: product.price,
        quantity,
        discount,
        gstRate: product.gstRate,
        cgst: gst / 2,
        sgst: gst / 2,
        igst: 0,
        total: discounted + gst,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const cgst = items.reduce((sum, item) => sum + item.cgst, 0);
    const sgst = items.reduce((sum, item) => sum + item.sgst, 0);
    const igst = items.reduce((sum, item) => sum + item.igst, 0);

    return {
      invoiceNumber: `INV-${now.getFullYear()}-${String(index + 1).padStart(4, '0')}`,
      customerId: buyerId,
      customerSnapshot: {
        name: `Customer ${index + 1}`,
        phone: `987654${String(1000 + index).slice(-4)}`,
        email: `customer${index + 1}@example.com`,
        address: `${index + 1}, Market Road`,
      },
      items,
      subtotal,
      cgst,
      sgst,
      igst,
      total: subtotal + cgst + sgst + igst,
      paymentMethod: index % 2 === 0 ? 'Cash' : 'Online',
      paymentStatus: 'Paid',
      pdfUrl: '',
      emailStatus: 'Sent',
      createdBy: ownerId,
      createdAt: new Date(Date.now() - index * 86400000),
      updatedAt: new Date(Date.now() - index * 86400000),
    };
  });
}

async function buildDemoUserPassword() {
  return bcrypt.hash(demoUserSeed.password, 10);
}

module.exports = {
  demoUserSeed,
  generateDemoProducts,
  generateDemoBuyers,
  generateDemoBills,
  buildDemoUserPassword,
};