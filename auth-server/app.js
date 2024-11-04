import express from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Low, JSONFile } from 'lowdb';
import nodemailer from 'nodemailer';

// Initialize the database
const adapter = new JSONFile('./database.json');
const db = new Low(adapter);

// Configuring the transporter for nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'michaelsonlata03@gmail.com', // Your email
        pass: 'Siemson123!' // Your email password or app password
    }
});

// Main async function to handle database reading
async function initializeDatabase() {
    await db.read();
    db.data ||= { users: [] }; // Initialize if no data
}

initializeDatabase().catch(console.error);

// Initialize Express app
const app = express();
const jwtSecretKey = 'dsfdsfsdfdsvcsvdfgefg'; // JWT secret key

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Main API route
app.get('/', (_req, res) => {
    res.send('Auth API.\nPlease use POST /auth & POST /verify for authentication');
});

// Authorization endpoint
app.post('/auth', async (req, res) => {
    const { email, password } = req.body;

    const user = db.data.users.find(user => email === user.email);

    if (user) {
        if (!user.isActive) {
            return res.status(403).json({ message: 'Konto nie zostało aktywowane.' });
        }

        bcrypt.compare(password, user.password, function (_err, result) {
            if (!result) {
                return res.status(401).json({ message: 'Invalid password' });
            } else {
                const loginData = { email, signInTime: Date.now() };
                const token = jwt.sign(loginData, jwtSecretKey);
                res.status(200).json({ message: 'success', token });
            }
        });
    } else {
        res.status(400).json({ message: 'Użytkownik nie istnieje.' });
    }
});

// JWT verification endpoint
app.post('/verify', (req, res) => {
    const tokenHeaderKey = 'jwt-token';
    const authToken = req.headers[tokenHeaderKey];

    try {
        const verified = jwt.verify(authToken, jwtSecretKey);
        if (verified) {
            return res.status(200).json({ status: 'logged in', message: 'success' });
        } else {
            return res.status(401).json({ status: 'invalid auth', message: 'error' });
        }
    } catch (error) {
        return res.status(401).json({ status: 'invalid auth', message: 'error' });
    }
});

// Account existence check endpoint
app.post('/check-account', (req, res) => {
    const { email } = req.body;

    const user = db.data.users.filter((user) => email === user.email);

    res.status(200).json({
        status: user.length === 1 ? 'User exists' : 'User does not exist',
        userExists: user.length === 1,
    });
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    // Sprawdzenie czy użytkownik już istnieje
    const userExists = db.data.users.some(user => user.email === email);
    if (userExists) {
        return res.status(400).json({ message: 'Użytkownik już istnieje' });
    }

    // Hashowanie hasła i generowanie linku aktywacyjnego
    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = jwt.sign({ email }, jwtSecretKey, { expiresIn: '1d' });

    // Dodawanie użytkownika do bazy danych
    db.data.users.push({ email, password: hashedPassword, isActive: false });
    await db.write();

    // Wysyłanie e-maila z linkiem aktywacyjnym
    const activationLink = `http://localhost:3000/activate/${activationToken}`;
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: email,
        subject: 'Aktywacja konta',
        text: `Kliknij w poniższy link, aby aktywować swoje konto: ${activationLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Błąd podczas wysyłania e-maila:', error);
            return res.status(500).json({ message: 'Błąd podczas wysyłania emaila' });
        }
        console.log('E-mail wysłany:', info.response);
        res.status(200).json({ message: 'success' });
    });
});

// Account activation endpoint
app.get('/activate/:token', async (req, res) => {
    const { token } = req.params;

    try {
        const decoded = jwt.verify(token, jwtSecretKey);
        const user = db.data.users.find(user => user.email === decoded.email);

        if (user) {
            user.isActive = true; // Aktywacja konta
            await db.write();
            res.status(200).send('Konto zostało aktywowane. Możesz teraz się zalogować.');
        } else {
            res.status(400).send('Nieprawidłowy token aktywacyjny.');
        }
    } catch (error) {
        res.status(400).send('Token wygasł lub jest nieprawidłowy.');
    }
});

// Start server
app.listen(3080, () => {
    console.log('Server is running on port 3080');
});
