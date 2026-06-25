const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, 'src', 'data', 'seed-catalog.json');
const catalogData = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Take an existing embedding and jitter it slightly so it has the right dimensions
const sampleEmbedding = catalogData[0].embedding;

const newPhones = [
  {
    "id": "prod-phone-001",
    "name": "Apple iPhone 15 Pro Max",
    "category": "Electronics",
    "subcategory": "Mobiles",
    "brand": "Apple",
    "price": 159900,
    "unit": "1 unit",
    "packSize": "1 unit",
    "tags": ["iphone", "apple", "smartphone", "ios", "mobile", "phone"],
    "dietary": [],
    "inStock": true,
    "popularity": 0.99,
    "imageUrl": "https://placehold.co/200x200/FF9900/131A22?text=iPhone+15",
    "embedding": sampleEmbedding.map(v => v + (Math.random() * 0.01))
  },
  {
    "id": "prod-phone-002",
    "name": "Samsung Galaxy S24 Ultra",
    "category": "Electronics",
    "subcategory": "Mobiles",
    "brand": "Samsung",
    "price": 129999,
    "unit": "1 unit",
    "packSize": "1 unit",
    "tags": ["samsung", "galaxy", "android", "smartphone", "mobile", "phone"],
    "dietary": [],
    "inStock": true,
    "popularity": 0.95,
    "imageUrl": "https://placehold.co/200x200/FF9900/131A22?text=S24+Ultra",
    "embedding": sampleEmbedding.map(v => v + (Math.random() * 0.01))
  },
  {
    "id": "prod-phone-003",
    "name": "OnePlus 12 5G",
    "category": "Electronics",
    "subcategory": "Mobiles",
    "brand": "OnePlus",
    "price": 64999,
    "unit": "1 unit",
    "packSize": "1 unit",
    "tags": ["oneplus", "android", "smartphone", "mobile", "phone", "fast charging"],
    "dietary": [],
    "inStock": true,
    "popularity": 0.92,
    "imageUrl": "https://placehold.co/200x200/FF9900/131A22?text=OnePlus12",
    "embedding": sampleEmbedding.map(v => v + (Math.random() * 0.01))
  },
  {
    "id": "prod-phone-004",
    "name": "Vivo X100 Pro",
    "category": "Electronics",
    "subcategory": "Mobiles",
    "brand": "Vivo",
    "price": 89999,
    "unit": "1 unit",
    "packSize": "1 unit",
    "tags": ["vivo", "android", "smartphone", "mobile", "phone", "camera"],
    "dietary": [],
    "inStock": true,
    "popularity": 0.88,
    "imageUrl": "https://placehold.co/200x200/FF9900/131A22?text=Vivo+X100",
    "embedding": sampleEmbedding.map(v => v + (Math.random() * 0.01))
  }
];

catalogData.push(...newPhones);

fs.writeFileSync(catalogPath, JSON.stringify(catalogData, null, 2));
console.log(`Added ${newPhones.length} mobile phones to catalog.`);
