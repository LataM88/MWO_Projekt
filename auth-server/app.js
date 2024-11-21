import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Konfiguracja Supabase
const supabaseUrl = 'https://qgjrvrjgmewqffywfxhh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanJ2cmpnbWV3cWZmeXdmeGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MTExMDMsImV4cCI6MjA0NjM4NzEwM30.hrnOev0tRUM9cUNugQu5BARLBrm3VbQS1VsCy4ZkMzM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const jwtSecretKey = 'dsfdsfsdfdsvcsvdfgefg'; // JWT secret key

// Middleware
app.use(cors());
app.use(express.json());

// Main API route
app.get('/', (_req, res) => {
    res.send('Auth API.\nPlease use POST /auth & POST /register for authentication');
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email);

        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({ message: 'Użytkownik już istnieje' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generowanie unikalnego kodu aktywacyjnego
        const activationCode = crypto.randomBytes(16).toString('hex');

        const { data, error } = await supabase
            .from('users')
            .insert([{ email, password: hashedPassword, isActive: false, activationCode }]);

        if (error) {
            console.error('Error inserting user:', error);
            return res.status(500).json({ message: 'Błąd rejestracji' });
        }

        // Wysyłanie linku aktywacyjnego
        const activationLink = `http://localhost:3080/activate?code=${activationCode}&email=${email}`;



        const mailOptions = {
            from: 'projekt.mwo24@gmail.com',
            to: email,
            subject: 'Aktywacja konta',
            text: `Kliknij w poniższy link, aby aktywować swoje konto: ${activationLink}`,
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error("Error sending email:", err);
                return res.status(500).json({ message: 'Błąd wysyłania e-maila.' });
            }
            res.status(200).json({ message: "success" });
        });
    } catch (err) {
        console.error('Unhandled error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
});


// Authorization endpoint
app.post('/auth', async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        return res.status(400).json({ message: 'Użytkownik nie istnieje.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ message: 'Konto nie zostało aktywowane. Sprawdź swój e-mail, aby je aktywować.' });
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {

        return res.status(401).json({ message: 'Nieprawidłowe hasło.' });

        return res.status(401).json({ message: 'Błędne hasło' });
    } else {
        const loginData = { email, signInTime: Date.now() };
        const token = jwt.sign(loginData, jwtSecretKey);


        res.status(200).json({
            message: 'success',
            token,
            userId: user.id // Zwracamy userId
        });

    }

    const loginData = { email, signInTime: Date.now() };
    const token = jwt.sign(loginData, jwtSecretKey);
    res.status(200).json({ message: 'success', token });
});


// Check if account exists endpoint
app.post('/check-account', async (req, res) => {
    const { email } = req.body;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error && error.details === 'The result contains 0 rows') {
            return res.status(200).json({ userExists: false });
        } else if (error) {
            console.error('Error finding user:', error);
            return res.status(500).json({ message: 'Błąd weryfikacji użytkownika' });
        }

        res.status(200).json({ userExists: !!user });
    } catch (err) {
        console.error('Unhandled error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
});

// Get all users from the database
app.get('/api/users', async (_req, res) => {
    try {
        const { data, error } = await supabase
            .from('users') // Assuming your table name is 'users'
            .select('*'); // Select all columns (or adjust if needed)

        if (error) {
            console.error('Error fetching users:', error);
            return res.status(500).json({ message: 'Błąd pobierania użytkowników' });
        }

        res.status(200).json(data); // Return users data in JSON format
    } catch (err) {
        console.error('Unhandled error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
});

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'projekt.mwo24@gmail.com',
        pass: 'dokr ytzb odhi ytgs'
    }
});

// Endpoint to send password reset link
// Endpoint to send password reset link
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;  // Pobieramy e-mail użytkownika z zapytania

    // Generowanie 6-cyfrowego kodu resetu
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Szukamy użytkownika w bazie danych
    const { data, error } = await supabase
        .from('users')
        .select('email, resetCode')
        .eq('email', email)
        .single(); // Pobieramy tylko jeden rekord (jeśli istnieje)

    if (error || !data) {
        return res.status(400).json({ message: 'Użytkownik nie istnieje.' });
    }

    // Aktualizowanie resetCode w bazie danych dla tego użytkownika
    const { error: updateError } = await supabase
        .from('users')
        .update({ resetCode }) // Ustawiamy nowy kod resetu
        .eq('email', email);

    if (updateError) {
        return res.status(500).json({ message: 'Błąd podczas aktualizacji kodu resetu.' });
    }

    // Wysyłanie kodu resetu na e-mail użytkownika
    const mailOptions = {
        from: 'projekt.mwo24@gmail.com',  // Adres e-mail nadawcy
        to: email,  // Używamy adresu e-mail użytkownika jako odbiorcy
        subject: 'Kod resetu hasła',
        text: `Twój kod resetu hasła to: ${resetCode}`  // Treść wiadomości
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.error("Error sending email:", err);  // Logowanie błędu w konsoli
            return res.status(500).json({ message: 'Błąd wysyłania e-maila.' });
        }
        res.status(200).json({ message: 'Kod resetu został wysłany na Twój e-mail.' });
    });
});


// Endpoint to reset the password
app.post('/reset-password', async (req, res) => {
    const { email, resetCode, newPassword } = req.body;

    // Weryfikowanie, czy kod resetu pasuje do zapisanego kodu w bazie
    const { data, error } = await supabase
        .from('users')
        .select('resetCode, password')
        .eq('email', email)
        .single(); // Pobieramy tylko jeden rekord

    if (error || !data) {
        return res.status(400).json({ message: 'Użytkownik nie istnieje.' });
    }

    // Sprawdzanie, czy kod resetu się zgadza
    if (data.resetCode !== resetCode) {
        return res.status(400).json({ message: 'Nieprawidłowy kod resetu.' });
    }

    // Szyfrowanie nowego hasła
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Aktualizowanie hasła i usuwanie resetCode z bazy
    const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword, resetCode: null }) // Resetujemy kod po zmianie hasła
        .eq('email', email);

    if (updateError) {
        return res.status(500).json({ message: 'Błąd aktualizacji hasła.' });
    }

    res.status(200).json({ message: 'Hasło zostało zmienione pomyślnie.' });
});
//lista użytkowników
app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, isActive, opis');


//endpoint aktywacja rejestracji
app.get('/activate', async (req, res) => {
    const { code, email } = req.query;

        if (!code || !email) {
            return res.status(400).json({ message: 'Brak kodu aktywacyjnego lub adresu e-mail.' });
        }

        try {
            // Pobierz użytkownika na podstawie email
            const { data: user, error } = await supabase
                .from('users')
                .select('activationCode, isActive')
                .eq('email', email)
                .single();

            if (error || !user) {
                return res.status(404).json({ message: 'Użytkownik nie istnieje.' });
            }

            // Sprawdź, czy konto jest już aktywne
            if (user.isActive) {
                return res.status(400).json({ message: 'Konto jest już aktywne.' });
            }

            // Sprawdź, czy kod aktywacyjny jest poprawny
            if (user.activationCode !== code) {
                return res.status(400).json({ message: 'Nieprawidłowy kod aktywacyjny.' });
            }

            // Zaktualizuj konto użytkownika
            const { error: updateError } = await supabase
                .from('users')
                .update({ isActive: true, activationCode: null }) // Usuwamy kod aktywacyjny
                .eq('email', email);

            if (updateError) {
                console.error('Error during account activation:', updateError);
                return res.status(500).json({ message: 'Błąd aktywacji konta.' });
            }

            // Zamiast zwracać JSON, przekierowujemy do strony frontendowej
            res.redirect(`http://localhost:3000/activate?status=success&email=${email}`);
        } catch (err) {
            console.error('Unhandled error:', err);
            res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
        }
});


    if (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Błąd serwera' });
    }

    res.status(200).json(data);
});
//informacje o użytkowniku
app.get('/activate', async (req, res) => {
    const { code, email } = req.query;

    if (!code || !email) {
        return res.status(400).json({ message: 'Brak kodu aktywacyjnego lub adresu e-mail.' });
    }

    try {
        // Pobierz użytkownika z bazy danych
        const { data: user, error } = await supabase
            .from('users')
            .select('activationCode, isActive')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(404).json({ message: 'Użytkownik nie istnieje.' });
        }

        if (user.isActive) {
            return res.status(400).json({ message: 'Konto jest już aktywne.' });
        }

        if (user.activationCode !== code) {
            return res.status(400).json({ message: 'Nieprawidłowy kod aktywacyjny.' });
        }

        // Aktywuj konto
        const { error: updateError } = await supabase
            .from('users')
            .update({ isActive: true, activationCode: null })
            .eq('email', email);

        if (updateError) {
            console.error('Error during account activation:', updateError);
            return res.status(500).json({ message: 'Błąd aktywacji konta.' });
        }

        // Przekierowanie na frontend
        res.redirect(`http://localhost:3000/activate?status=success&email=${email}`);
    } catch (err) {
        console.error('Unhandled error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});



// Start server
app.listen(3080, () => {
    console.log('Server is running on port 3080');
});