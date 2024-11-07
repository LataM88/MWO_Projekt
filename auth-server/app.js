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

// Endpoint do wysyłania kodu resetu
app.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

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

        if (error || !data) {
            return res.status(400).json({ message: 'Użytkownik nie istnieje.' });
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

// Start serwera
app.listen(3080, () => {
    console.log('Server is running on port 3080');
});
