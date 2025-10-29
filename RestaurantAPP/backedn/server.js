const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./models/user');
const Restaurant = require('./models/Restaurant');
const Rating = require('./models/Rating');
const Avatar = require('./models/Avatar');
const Reservation = require('./models/Reservation');

dotenv.config();

const app = express();
const port = 3000;

// Middleware do parsowania JSON
app.use(express.json());
app.use(cors());

// Połączenie z MongoDB
const dbURI = process.env.MONGODB_URI;
mongoose.connect(dbURI)
    .then(() => console.log('Połączono z MongoDB'))
    .catch(err => console.error('Błąd połączenia z MongoDB:', err));

// Middleware do weryfikacji tokenu JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Trasa rejestracji
app.post('/api/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, accountType, phone, address } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ firstName, lastName, email, password: hashedPassword, accountType, phone, address });
        const savedUser = await user.save();
        res.status(201).json(savedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Trasa logowania
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            console.error('Invalid email');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error('Invalid password');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign({ userId: user._id, username: user.username, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: err.message });
    }
});

// Trasa do pobierania danych zalogowanego użytkownika
app.get('/api/user', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trasa do dodawania oceny
// app.post('/api/restaurants/:id/rate', authenticateToken, async (req, res) => {
//     try {
//         const { rating, comment } = req.body;
//         const restaurant = await Restaurant.findById(req.params.id);
//         if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

//         const newRating = new Rating({ user: req.user.userId, restaurant: req.params.id, rating, comment });
//         await newRating.save();

//         // Pobierz wszystkie oceny, aby obliczyć średnią na nowo
//         const ratings = await Rating.find({ restaurant: req.params.id });
//         const averageRating = ratings.reduce((acc, cur) => acc + cur.rating, 0) / ratings.length;

//         restaurant.rating = averageRating;
//         restaurant.ratingCount = ratings.length;
//         await restaurant.save();

//         res.status(201).json(newRating);
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// Trasa do dodawania oceny
app.post('/api/restaurants/:id/rate', authenticateToken, async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        // Sprawdź, czy użytkownik już ocenił tę restaurację
        let userRating = await Rating.findOne({ user: req.user.userId, restaurant: req.params.id });
        if (userRating) {
            userRating.rating = rating;
            userRating.comment = comment;
            await userRating.save();
        } else {
            userRating = new Rating({ user: req.user.userId, restaurant: req.params.id, rating, comment });
            await userRating.save();
        }

        // Pobierz wszystkie oceny, aby obliczyć średnią na nowo
        const ratings = await Rating.find({ restaurant: req.params.id });
        const averageRating = ratings.reduce((acc, cur) => acc + cur.rating, 0) / ratings.length;

        restaurant.rating = averageRating;
        restaurant.ratingCount = ratings.length;
        await restaurant.save();

        res.status(201).json(userRating);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




app.get('/api/restaurants/:id/ratings', async (req, res) => {
    try {
        const ratings = await Rating.find({ restaurant: req.params.id }).populate('user', 'firstName lastName');
        res.json(ratings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trasa do pobierania oceny użytkownika dla danej restauracji
app.get('/api/restaurants/:id/rating', authenticateToken, async (req, res) => {
    try {
        const rating = await Rating.findOne({ user: req.user.userId, restaurant: req.params.id });
        if (!rating) {
            return res.status(404).json({ message: 'Rating not found' });
        }
        res.json(rating);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Prosta trasa testowa
app.get('/', (req, res) => {
    res.send('Witaj w aplikacji restauracyjnej!');
});

// Trasa zwracająca wszystkie restauracje
app.get('/api/restaurants', async (req, res) => {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trasa zwracająca trzy najlepsze restauracje
app.get('/api/top-restaurants', async (req, res) => {
    try {
        const topRestaurants = await Restaurant.find().sort({ rating: -1 }).limit(3);
        res.json(topRestaurants);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trasa do pobierania jednej restauracji
app.get('/api/restaurants/:id', async (req, res) => {
    try {
      const restaurant = await Restaurant.findById(req.params.id);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      res.json(restaurant);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Trasa do pobierania restauracji po nazwie
app.get('/api/restaurants/name/:name', async (req, res) => {
    try {
        const name = req.params.name.replace(/_/g, ' ');
        const restaurant = await Restaurant.findOne({ name: name });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// // Trasa do zmiany awatara użytkownika
// app.put('/api/user/avatar', authenticateToken, async (req, res) => {
//     try {
//         const { avatarUrl } = req.body;
//         const user = await User.findById(req.user.userId);
//         if (!user) return res.status(404).json({ message: 'User not found' });

//         user.avatar = avatarUrl;
//         await user.save();

//         res.status(200).json({ message: 'Avatar updated successfully', avatar: user.avatar });
//     } catch (err) {
//         res.status(500).json({ message: err.message });
//     }
// });

// Trasa do zmiany awatara użytkownika
app.put('/api/user/avatar', authenticateToken, async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.avatar = avatarUrl;
        await user.save();

        res.status(200).json(user); // Return the updated user object
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trasa do pobierania wszystkich awatarów
app.get('/api/avatars', async (req, res) => {
    try {
        const avatars = await Avatar.find();
        res.json(avatars);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint do składania rezerwacji
app.post('/api/reservations', authenticateToken, async (req, res) => {
    try {
        const { restaurantId, date, time, seats } = req.body;
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const availableTable = restaurant.availableTables.find(table => table.size >= seats && table.count > 0);
        if (!availableTable) return res.status(400).json({ message: 'No available tables for the specified number of seats' });

        const reservation = new Reservation({
            userId: req.user.userId,
            restaurantId,
            date,
            time,
            seats
        });
        await reservation.save();

        availableTable.count -= 1;
        await restaurant.save();

        res.status(201).json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint do aktualizacji dostępności stolików
app.put('/api/restaurants/:id/update-tables', authenticateToken, async (req, res) => {
    try {
        const { availableTables } = req.body;
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        restaurant.availableTables = availableTables;
        await restaurant.save();

        res.status(200).json(restaurant);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Trasa zwracająca wszystkie rezerwacje
app.get('/api/reservations', authenticateToken, async (req, res) => {
    try {
        const reservations = await Reservation.find().populate('restaurantId userId');
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint do aktualizacji rezerwacji
app.put('/api/reservations/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Received data:', req.body);

        const { date, time, seats } = req.body;
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            console.log('Reservation not found:', req.params.id);
            return res.status(404).json({ message: 'Reservation not found' });
        }

        const restaurant = await Restaurant.findById(reservation.restaurantId);
        if (!restaurant) {
            console.log('Restaurant not found for reservation:', reservation.restaurantId);
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        console.log(`Updating reservation for user: ${reservation.userId} at restaurant: ${restaurant.name}`);
        console.log(`Current reservation seats: ${reservation.seats}, new seats: ${seats}`);

        if (new Date(date) <= new Date()) {
            console.log('Attempt to update reservation less than a day in advance');
            return res.status(400).json({ message: 'Reservation cannot be updated less than a day in advance' });
        }

        // Zwiększ dostępność poprzedniego stolika
        const previousTable = restaurant.availableTables.find(table => table.size === reservation.seats);
        if (previousTable) {
            console.log(`Freeing previous table for ${previousTable.size} seats`);
            previousTable.count += 1;
        } else {
            console.log('Previous table not found');
        }

        console.log('Available tables before finding new table:', restaurant.availableTables);

        // Sprawdzenie dostępności nowego stolika
        const availableTable = restaurant.availableTables.find(table => {
            console.log(`Checking table size: ${table.size}, requested size: ${seats}`);
            return table.size === seats && table.count > 0;
        });

        if (!availableTable) {
            // Przywróć poprzedni stolik w przypadku braku nowego
            if (previousTable) {
                console.log('Restoring previous table count due to no available new table');
                previousTable.count -= 1;
            }
            console.log('No available tables for the specified number of seats');
            return res.status(400).json({ message: 'No available tables for the specified number of seats' });
        }

        console.log(`Reserving new table for ${availableTable.size} seats`);
        availableTable.count -= 1;

        console.log('Available tables after finding new table:', restaurant.availableTables);

        // Aktualizacja rezerwacji
        reservation.date = date;
        reservation.time = time;
        reservation.seats = seats;
        await reservation.save();

        // Zapisz zmiany w restauracji
        await restaurant.save();

        res.status(200).json(reservation);
    } catch (err) {
        console.error('Error updating reservation:', err.message);
        res.status(500).json({ message: err.message });
    }
});





// Endpoint do usuwania rezerwacji
app.delete('/api/reservations/:id', authenticateToken, async (req, res) => {
    try {
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }

        // Znajdź restaurację
        const restaurant = await Restaurant.findById(reservation.restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Znajdź odpowiedni stolik i zwiększ jego liczbę dostępnych miejsc
        const table = restaurant.availableTables.find(table => table.size >= reservation.seats);
        if (table) {
            table.count += 1;
        }

        // Zapisz zmiany w restauracji
        await restaurant.save();

        // Usuń rezerwację
        await reservation.deleteOne();

        res.status(200).json({ message: 'Reservation deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

  
// Endpoint do pobierania rezerwacji użytkownika dla danej restauracji
app.get('/api/reservations/user/:userId/restaurant/:restaurantId', authenticateToken, async (req, res) => {
    try {
        const { userId, restaurantId } = req.params;
        const reservation = await Reservation.findOne({ userId, restaurantId });
        if (!reservation) {
            return res.status(404).json({ message: 'Reservation not found' });
        }
        res.json(reservation);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Endpoint do pobierania awatara użytkownika
app.get('/api/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user.avatar);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

  
// Trasa zwracająca wszystkie rezerwacje użytkownika
app.get('/api/reservations/user/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        const reservations = await Reservation.find({ userId }).populate('restaurantId');
        res.json(reservations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// System rekomendacji restauracji
app.get('/api/recommendations/restaurants', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).populate('ratings.restaurant');
        const restaurants = await Restaurant.find();

        if (!user) return res.status(404).json({ message: 'User not found' });

        // Oblicz rekomendacje restauracji przy użyciu k-NN
        const recommendations = calculateKNNRecommendations(user, restaurants, 3);

        res.json(recommendations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

function calculateKNNRecommendations(user, restaurants, k) {
    const userRatings = user.ratings;

    const recommendations = restaurants.map(restaurant => {
        const distance = calculateDistance(userRatings, restaurant);
        return { ...restaurant._doc, distance };
    }).sort((a, b) => a.distance - b.distance);

    return recommendations.slice(0, k);
}

function calculateDistance(userRatings, restaurant) {
    let distance = 0;

    userRatings.forEach(rating => {
        if (rating.restaurant.category !== restaurant.category) distance += 1;
        if (rating.restaurant.cuisine !== restaurant.cuisine) distance += 1;
    });

    distance += 5 - restaurant.rating;
    return distance;
}

// Rekomendacje użytkowników za pomoca k-NN
app.get('/api/recommendations/users', authenticateToken, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.userId).populate('ratings.restaurant');
        const users = await User.find({ _id: { $ne: currentUser._id }}).populate('ratings.restaurant');

        if (!currentUser) return res.status(404).json({ message: 'User not found' });

        // Oblicz rekomendacje użytkowników przy użyciu k-NN
        const similarUsers = calculateKNNUserRecommendations(currentUser, users, 1);

        res.json(similarUsers[0]); // Zwracamy najbardziej podobnego użytkownika
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

function calculateKNNUserRecommendations(currentUser, users, k) {
    const recommendations = users.map(user => {
        const distance = calculateUserDistance(currentUser, user);
        return { ...user._doc, distance };
    }).sort((a, b) => a.distance - b.distance);

    return recommendations.slice(0, k);
}

function calculateUserDistance(user1, user2) {
    let distance = 0;

    user1.ratings.forEach(rating1 => {
        user2.ratings.forEach(rating2 => {
            if (rating1.restaurant.category !== rating2.restaurant.category) distance += 1;
            if (rating1.restaurant.cuisine !== rating2.restaurant.cuisine) distance += 1;
        });
    });

    return distance;
}


// Endpoint do pobierania ocen użytkownika z restauracjami
app.get('/api/users/:id/ratings', authenticateToken, async (req, res) => {
    try {
        const userRatings = await Rating.find({ user: req.params.id }).populate('restaurant');
        res.json(userRatings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});











// Start serwera
app.listen(port, () => {
    console.log(`Serwer działa na porcie ${port}`);
});
