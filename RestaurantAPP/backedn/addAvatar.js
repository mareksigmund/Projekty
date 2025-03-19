// initAvatars.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Avatar = require('./models/Avatar');

dotenv.config();

// Połączenie z MongoDB
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Połączono z MongoDB');

        // Przykładowe awatary do dodania
        const avatars = [
            {
                name: 'default',
                description: 'Default avatar',
                url: 'https://i.postimg.cc/13H04n4n/default.webp'
            },
            {
                name: 'first',
                description: 'Avatar 1',
                url: 'https://i.postimg.cc/QNmj4jBg/first.webp'
            },
            {
                name: 'second',
                description: 'Avatar 2',
                url: 'https://i.postimg.cc/sxjsjNLZ/second.webp'
            },
            {
                name: 'third',
                description: 'Avatar 3',
                url: 'https://i.postimg.cc/Hx4TCg6g/third.webp'
            },
            {
                name: 'fourth',
                description: 'Avatar 4',
                url: 'https://i.postimg.cc/qq10zGfD/fourth.webp'
            }
        ];

        // Dodanie awatarów do bazy danych
        return Avatar.insertMany(avatars);
    })
    .then(() => {
        console.log('Awatary dodane do bazy danych');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Błąd połączenia z MongoDB:', err);
    });
