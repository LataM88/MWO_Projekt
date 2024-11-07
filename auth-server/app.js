import express from 'express';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// Konfiguracja Supabase
const supabaseUrl = 'https://qgjrvrjgmewqffywfxhh.supabase.co';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Zastąp odpowiednim kluczem
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Konfiguracja Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail', // Możesz wybrać innego dostawcę
    auth: {
        user: 'your_email@gmail.com', // Twój adres e-mail
        pass: 'your_email_password'   // Twoje hasło do konta Gmail (lub aplikacyjne hasło, jeśli masz 2FA)
    }
});

// Inicjalizacja Express
const app = express();
app.use(cors());
app.use(express.json());

<<<<<<< HEAD
// Endpoint do wysyłania kodu resetu
=======
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
        const { data, error } = await supabase
            .from('users')
            .insert([{ email, password: hashedPassword, isActive: true }]);

        if (error) {
            console.error('Error inserting user:', error);
            return res.status(500).json({ message: 'Błąd rejestracji' });
        }

        res.status(200).json({ message: 'success' });
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

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
        return res.status(401).json({ message: 'Invalid password' });
    } else {
        const loginData = { email, signInTime: Date.now() };
        const token = jwt.sign(loginData, jwtSecretKey);
        res.status(200).json({ message: 'success', token });
    }
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

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'projekt.mwo24@gmail.com',
        pass: 'dokr ytzb odhi ytgs'
    }
});

// Endpoint to send password reset link
// Endpoint to send password reset link
>>>>>>> c7ccb1b767c529d585140404884bafe37045b464
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;  // Pobieramy e-mail użytkownika z zapytania

    if (!email) {
        return res.status(400).json({ message: 'E-mail jest wymagany.' });
    }

    // Generowanie 6-cyfrowego kodu resetu
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        // Szukamy użytkownika w bazie danych
        const { data, error } = await supabase
            .from('users')
            .select('email, resetCode')
            .eq('email', email)
            .single(); // Pobieramy tylko jeden rekord (jeśli istnieje)

<<<<<<< HEAD
        if (error || !data) {
            return res.status(400).json({ message: 'Użytkownik nie istnieje.' });
=======
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
>>>>>>> c7ccb1b767c529d585140404884bafe37045b464
        }

        // Aktualizowanie kodu resetu w bazie danych
        const { error: updateError } = await supabase
            .from('users')
            .update({ resetCode }) // Zapisujemy nowy kod resetu w bazie
            .eq('email', email);

        if (updateError) {
            return res.status(500).json({ message: 'Błąd podczas aktualizacji kodu resetu.' });
        }

        // Wysyłanie wiadomości e-mail z kodem resetu
        const mailOptions = {
            from: 'your_email@gmail.com',
            to: email,
            subject: 'Kod resetu hasła',
            text: `Twój kod resetu hasła to: ${resetCode}`
        };

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                return res.status(500).json({ message: 'Błąd wysyłania e-maila.' });
            }
            res.status(200).json({ message: 'Kod resetu został wysłany na Twój e-mail.' });
        });

    } catch (err) {
        console.error('Błąd podczas resetu hasła:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

<<<<<<< HEAD
// Start serwera
=======

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


// Start server
>>>>>>> c7ccb1b767c529d585140404884bafe37045b464
app.listen(3080, () => {
    console.log('Server is running on port 3080');
});
