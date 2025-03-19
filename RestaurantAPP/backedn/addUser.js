const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/user');

dotenv.config();

// Połączenie z MongoDB
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
    .then(() => {
        console.log('Połączono z MongoDB');

        // Przykładowi użytkownicy do dodania
        const users = [
            { 
                firstName: 'Jan', 
                lastName: 'Kowalski', 
                email: 'jan.kowalski@example.com', 
                password: 'password123', 
                accountType: 'customer',
                phone: '123-456-7890',
                address: {
                    street: 'Main St',
                    city: 'Warsaw',
                    state: 'Mazowieckie',
                    zip: '00-001'
                }
            },
            { 
                firstName: 'Anna', 
                lastName: 'Nowak', 
                email: 'anna.nowak@example.com', 
                password: 'password123', 
                accountType: 'manager',
                phone: '098-765-4321',
                address: {
                    street: 'Second St',
                    city: 'Krakow',
                    state: 'Malopolskie',
                    zip: '30-002'
                }
            }
        ];

        // Dodanie użytkowników do bazy danych
        return User.insertMany(users);
    })
    .then(() => {
        console.log('Użytkownicy dodani do bazy danych');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Błąd połączenia z MongoDB:', err);
    });
