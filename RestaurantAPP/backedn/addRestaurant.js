const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('./models/Restaurant');

dotenv.config();

// Połączenie z MongoDB
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Połączono z MongoDB');

        // Helper function to generate random integer between min and max (inclusive)
        const getRandomInt = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        // Przykładowe restauracje do dodania
        const restaurants = [
            {
                name: 'Gourmet Haven',
                description: 'A delightful place offering a fusion of global cuisines in a cozy atmosphere.',
                tables: [
                    { size: 2, count: 12 },
                    { size: 4, count: 6 },
                    { size: 6, count: 3 }
                ],
                availableTables: [
                    { size: 2, count: 12 },
                    { size: 4, count: 6 },
                    { size: 6, count: 3 }
                ],
                rating: getRandomInt(0, 5),
                ratingCount: getRandomInt(0, 50),
                images: [
                    'https://i.postimg.cc/GhtrtJZy/Gourmet-Haven-1.webp',
                    'https://i.postimg.cc/zD08qPPN/Gourmet-Haven-2.webp',
                    'https://i.postimg.cc/MG7JNsjh/Gourmet-Haven-3.webp',
                    'https://i.postimg.cc/1zhZWx4G/Gourmet-Haven-4.webp'
                  ],
                menu: [
                    { name: 'Fusion Delight', description: 'A mix of exotic flavors from around the world.', price: 25.99 },
                    { name: 'Chef’s Special', description: 'A surprise dish crafted by our head chef.', price: 30.99 },
                    { name: 'Vegan Paradise', description: 'A delightful vegan dish with seasonal vegetables.', price: 20.99 }
                ],
                category: 'Fine Dining',
                priceRange: '$$$',
                location: 'New York, NY',
                cuisine: 'Fusion'
            },
            {
                name: 'Urban Eats',
                description: 'A modern eatery offering fast and delicious meals for the urban lifestyle.',
                tables: [
                    { size: 2, count: 10 },
                    { size: 4, count: 8 },
                    { size: 6, count: 4 }
                ],
                availableTables: [
                    { size: 2, count: 10 },
                    { size: 4, count: 8 },
                    { size: 6, count: 4 }
                ],
                rating: getRandomInt(0, 5),
                ratingCount: getRandomInt(0, 50),
                images: [
                    'https://i.postimg.cc/GhtrtJZy/Gourmet-Haven-1.webp',
                    'https://i.postimg.cc/zD08qPPN/Gourmet-Haven-2.webp',
                    'https://i.postimg.cc/MG7JNsjh/Gourmet-Haven-3.webp',
                    'https://i.postimg.cc/1zhZWx4G/Gourmet-Haven-4.webp'
                  ],
                menu: [
                    { name: 'Burger Blast', description: 'Juicy burgers with a variety of toppings.', price: 12.99 },
                    { name: 'Urban Salad', description: 'Fresh and healthy salads with a twist.', price: 10.99 },
                    { name: 'Street Tacos', description: 'Authentic street tacos with spicy fillings.', price: 8.99 }
                ],
                category: 'Casual Dining',
                priceRange: '$$',
                location: 'Los Angeles, CA',
                cuisine: 'American'
            },
            {
                name: 'Pasta Palace',
                description: 'A family-owned restaurant serving traditional Italian pasta dishes.',
                tables: [
                    { size: 2, count: 15 },
                    { size: 4, count: 10 },
                    { size: 6, count: 5 }
                ],
                availableTables: [
                    { size: 2, count: 15 },
                    { size: 4, count: 10 },
                    { size: 6, count: 5 }
                ],
                rating: getRandomInt(0, 5),
                ratingCount: getRandomInt(0, 50),
                images: [
                    'https://i.postimg.cc/GhtrtJZy/Gourmet-Haven-1.webp',
                    'https://i.postimg.cc/zD08qPPN/Gourmet-Haven-2.webp',
                    'https://i.postimg.cc/MG7JNsjh/Gourmet-Haven-3.webp',
                    'https://i.postimg.cc/1zhZWx4G/Gourmet-Haven-4.webp'
                  ],
                menu: [
                    { name: 'Spaghetti Bolognese', description: 'Classic spaghetti with rich bolognese sauce.', price: 14.99 },
                    { name: 'Penne Arrabbiata', description: 'Penne pasta with a spicy tomato sauce.', price: 13.99 },
                    { name: 'Fettuccine Alfredo', description: 'Creamy alfredo sauce with fettuccine.', price: 16.99 }
                ],
                category: 'Family Dining',
                priceRange: '$$',
                location: 'Chicago, IL',
                cuisine: 'Italian'
            },
            {
                name: 'Sushi Central',
                description: 'A sushi restaurant offering the freshest sushi and sashimi.',
                tables: [
                    { size: 2, count: 8 },
                    { size: 4, count: 5 },
                    { size: 6, count: 2 }
                ],
                availableTables: [
                    { size: 2, count: 8 },
                    { size: 4, count: 5 },
                    { size: 6, count: 2 }
                ],
                rating: getRandomInt(0, 5),
                ratingCount: getRandomInt(0, 50),
                images: [
                    'https://i.postimg.cc/GhtrtJZy/Gourmet-Haven-1.webp',
                    'https://i.postimg.cc/zD08qPPN/Gourmet-Haven-2.webp',
                    'https://i.postimg.cc/MG7JNsjh/Gourmet-Haven-3.webp',
                    'https://i.postimg.cc/1zhZWx4G/Gourmet-Haven-4.webp'
                  ],
                menu: [
                    { name: 'Dragon Roll', description: 'A sushi roll with eel, avocado, and cucumber.', price: 18.99 },
                    { name: 'Salmon Sashimi', description: 'Fresh salmon sashimi served with soy sauce.', price: 20.99 },
                    { name: 'Tuna Nigiri', description: 'Slices of tuna on a bed of sushi rice.', price: 15.99 }
                ],
                category: 'Fine Dining',
                priceRange: '$$$',
                location: 'San Francisco, CA',
                cuisine: 'Japanese'
            }
        ];

        // Dodanie restauracji do bazy danych
        return Restaurant.insertMany(restaurants);
    })
    .then(() => {
        console.log('Restauracje dodane do bazy danych');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Błąd połączenia z MongoDB:', err);
    });
