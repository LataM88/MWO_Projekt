import express from 'express';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
//Profilowe
import multer from 'multer';


const upload = multer({ storage: multer.memoryStorage() });

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
        const activationExpires = new Date();
        activationExpires.setDate(activationExpires.getDate() + 7);

        const { data, error } = await supabase
            .from('users')
            .insert([{ email, password: hashedPassword, isActive: false, activationCode, activationExpires }]);

        if (error) {
            console.error('Error inserting user:', error);
            return res.status(500).json({ message: 'Błąd rejestracji' });
        }


        // Wysyłanie linku aktywacyjnego
        const activationLink = `http://localhost:3080/activate?code=${activationCode}&email=${email}`;

const mailOptions = {
    from: '"ProjektMWO2024" <projekt.mwo24@gmail.com>', // Nadawca
    to: email, // Odbiorca
    subject: 'Link weryfikacyjny',
    html: `
        <div style="width: 100%; background-color: rgba(21, 72, 75, 1); padding: 20px; font-family: 'Langar', sans-serif; box-sizing: border-box;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); text-align: center;">
                <h1 style="font-size: 24px; color: rgba(21, 72, 75, 1); margin-bottom: 20px;">Kod weryfikacyjny</h1>
                <p style="font-size: 16px; color: black; margin-bottom: 30px;">Twój kod weryfikacyjny:</p>
                <a href="${activationLink}" style="font-size: 20px; font-weight: bold; background-color: rgba(21, 72, 75, 1); color: white; padding: 10px 20px; border-radius: 25px; text-decoration: none; display: inline-block; margin-bottom: 30px;">
                 Kliknij tutaj, aby aktywować
            </a>
        </div>
    `
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
// Import nodemailer (jest już zaimportowany)

const generateTwoFactorCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// Modyfikacja endpointu logowania
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
    } else {
        // Generowanie kodu 2FA
        const twoFactorCode = generateTwoFactorCode();
        const { error: updateError } = await supabase
            .from('users')
            .update({ twoFactorCode })
            .eq('id', user.id);

        if (updateError) {
            console.error('Błąd aktualizacji kodu 2FA:', updateError);
            return res.status(500).json({ message: 'Błąd serwera podczas generowania kodu 2FA' });
        }

        // Wysyłanie kodu 2FA e-mailem
const mailOptions = {
    from: '"ProjektMWO2024" <projekt.mwo24@gmail.com>', // Nadawca
    to: email, // Odbiorca
    subject: 'Kod weryfikacyjny',
    html: `
        <div style="width: 100%; background-color: rgba(21, 72, 75, 1); padding: 20px; font-family: 'Langar', sans-serif; box-sizing: border-box;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); text-align: center;">
                <h1 style="font-size: 24px; color: rgba(21, 72, 75, 1); margin-bottom: 20px;">Kod weryfikacyjny</h1>
                <p style="font-size: 16px; color: black; margin-bottom: 30px;">Twój kod weryfikacyjny:</p>
                <div style="font-size: 30px; font-weight: bold; background-color: rgba(21, 72, 75, 1); color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 30px;">
                    ${twoFactorCode}
        </div>
    `
};

        transporter.sendMail(mailOptions, (err) => {
            if (err) {
                console.error('Błąd wysyłania kodu 2FA:', err);
                return res.status(500).json({ message: 'Błąd wysyłania kodu 2FA' });
            }

            res.status(200).json({ message: 'success', userId: user.id });
        });
    }
});

// Endpoint do weryfikacji kodu 2FA
app.post('/verify-2fa', async (req, res) => {
    const { userId, twoFactorCode } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('twoFactorCode')
        .eq('id', userId)
        .single();

    if (error || !user) {
        return res.status(400).json({ message: 'Nieprawidłowy użytkownik.' });
    }

    if (user.twoFactorCode !== twoFactorCode) {
        return res.status(401).json({ message: 'Nieprawidłowy kod weryfikacyjny.' });
    }

    // Usunięcie kodu po pomyślnej weryfikacji
    const { error: updateError } = await supabase
        .from('users')
        .update({ twoFactorCode: null })
        .eq('id', userId);

    if (updateError) {
        console.error('Błąd usuwania kodu 2FA:', updateError);
        return res.status(500).json({ message: 'Błąd serwera' });
    }

    // Generowanie tokenu JWT
    const loginData = { userId, signInTime: Date.now() };
    const token = jwt.sign(loginData, jwtSecretKey);

    res.status(200).json({ message: 'Weryfikacja pomyślna', token });
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
    // Obsługa tablicy postów



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
    from: '"ProjektMWO2024" <projekt.mwo24@gmail.com>', // Nadawca
    to: email, // Odbiorca
    subject: 'Kod resetu hasła',
    html: `
        <div style="width: 100%; background-color: rgba(21, 72, 75, 1); padding: 20px; font-family: 'Langar', sans-serif; box-sizing: border-box;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); text-align: center;">
                <h1 style="font-size: 24px; color: rgba(21, 72, 75, 1); margin-bottom: 20px;">Kod resetu hasła</h1>
                <p style="font-size: 16px; color: black; margin-bottom: 30px;">Twój kod resetu hasła to:</p>
                <div style="font-size: 30px; font-weight: bold; background-color: rgba(21, 72, 75, 1); color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; margin-bottom: 30px;">
                    ${resetCode}
        </div>
    `
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

app.get('/activate', async (req, res) => {
    const { code, email } = req.query;

    if (!code || !email) {
        return res.status(400).json({ message: 'Brak kodu aktywacyjnego lub adresu e-mail.' });
    }

    try {
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

        // Sprawdzenie daty wygaśnięcia
        const now = new Date();
        if (new Date(user.activationExpires) < now) {
            return res.status(400).json({ message: 'Link aktywacyjny wygasł.' });
        }

        // Aktywacja konta
        const { error: updateError } = await supabase
            .from('users')
            .update({ isActive: true, activationCode: null, activationExpires: null })
            .eq('email', email);

        if (updateError) {
            return res.status(500).json({ message: 'Błąd aktywacji konta.' });
        }

        // Przekierowanie na frontend
        res.redirect(`http://localhost:3000/activate?status=success&email=${email}`);
    } catch (err) {
        console.error('Unhandled error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, isActive, opis');

    if (error) {
        console.error('Error fetching users:', error);
        return res.status(500).json({ message: 'Błąd serwera' });
    }

    res.status(200).json(data);
});
//informacje o użytkowniku
app.get('/user/:id', async (req, res) => {
    const { id } = req.params; // Pobranie ID z parametru ścieżki


    try {
        // Zapytanie do Supabase po użytkownika z określonym ID
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single(); // Oczekujemy dokładnie jednego wyniku

        if (error || !data) {
            console.error('Error fetching user:', error || 'No user found');
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        res.status(200).json(data); // Zwrócenie danych użytkownika
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
});
app.put('/user/:id', async (req, res) => {
    const userId = req.params.id;  // ID użytkownika z URL
    const { opis } = req.body;     // Nowy opis z body żądania

    try {
        // Szukamy użytkownika w bazie danych
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();  // Oczekujemy dokładnie jednego użytkownika

        if (error || !user) {
            return res.status(404).json({ message: 'Użytkownik nie znaleziony' });
        }

        // Aktualizowanie opisu użytkownika
        const { error: updateError } = await supabase
            .from('users')
            .update({ opis })  // Zaktualizowanie opisu
            .eq('id', userId);  // Określamy, którego użytkownika chcemy zaktualizować

        if (updateError) {
            console.error('Błąd podczas aktualizacji opisu:', updateError);
            return res.status(500).json({ message: 'Błąd serwera podczas aktualizacji opisu' });
        }

        // Zwrócenie zaktualizowanego użytkownika
        res.status(200).json({ message: 'Opis został zaktualizowany pomyślnie', user });
    } catch (err) {
        console.error('Błąd podczas aktualizacji opisu:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera' });
    }
});

// Aktualizacja zdjęcia profilowego
app.post('/upload-profile-image/:userId', upload.single('image'), async (req, res) => {
    const { userId } = req.params;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ message: 'Plik nie został przesłany.' });
    }

    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}.${fileExtension}`;

    try {
        // Check if file exists
        const { data: existingFile, error: checkError } = await supabase
            .storage
            .from('profile-image')
            .list('', { search: fileName });

        if (checkError) {
            console.error('Error checking existing file in Supabase:', checkError);
            return res.status(500).json({ message: 'Error checking file existence in Supabase.' });
        }

        // If file exists, delete it
        if (existingFile.length > 0) {
            const { error: deleteError } = await supabase
                .storage
                .from('profile-image')
                .remove([fileName]);

            if (deleteError) {
                console.error('Error deleting existing file in Supabase:', deleteError);
                return res.status(500).json({ message: 'Error deleting existing file in Supabase.' });
            }
        }

        // Upload new file
        const { data, error } = await supabase.storage
            .from('profile-image')
            .upload(fileName, file.buffer, { contentType: file.mimetype });

        if (error) {
            console.error('Error uploading image to Supabase:', error);
            return res.status(500).json({ message: 'Błąd przesyłania obrazu do Supabase.' });
        }

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/profile-image/${fileName}?${new Date().getTime()}`

        const { error: updateError } = await supabase
            .from('users')
            .update({ image: imageUrl })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating user profile image:', updateError);
            return res.status(500).json({ message: 'Błąd aktualizacji profilu użytkownika.' });
        }

        res.status(200).json({ imageUrl });
    } catch (err) {
        console.error('Błąd podczas przetwarzania obrazu:', err);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

app.get('/api/user', async (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Pobierz token z nagłówka

    if (!token) {
        return res.status(401).json({ error: 'Brak tokenu' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Weryfikacja tokenu
        const userId = decoded.id;

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        res.json(user); // Zwróć dane użytkownika
    } catch (err) {
        console.error('Błąd weryfikacji tokenu:', err);
        res.status(500).json({ error: 'Błąd serwera' });
    }
});

// Endpoint do pobierania postów
app.get('/api/posts', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('posts')
            .select(`
        id,
        content,
        created_at,
        users:users (
            email,
            imie,
            nazwisko,
            image
        )
    `)
            .order('created_at', { ascending: false });
        console.log('Pobrane dane z Supabase:', data);
        if (error) {
            console.log('Błąd podczas pobierania postów:', error);
            return res.status(500).json({ error: 'Błąd pobierania postów' });
        }

        console.log('Pobrane dane z Supabase:', data);

        const posts = data.map(post => ({
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            user: post.users ? {
                email: post.users.email || 'Nieznany użytkownik',
                imie: post.users.imie || 'Nieznane imię',
                nazwisko: post.users.nazwisko || 'Nieznane nazwisko',
                image: post.users.image || 'default-avatar.jpg',
            } : null
        }));

        res.status(200).json(posts);
    } catch (error) {
        console.log('Błąd serwera:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});


// Endpoint do dodawania postów
app.post('/api/posts', async (req, res) => {
    const { users_id, content } = req.body;

    if (!users_id || !content) {
        console.log('Brak wymaganych pól:', { users_id, content });
        return res.status(400).json({ error: 'Brakuje wymaganych pól: users_id, content' });
    }

    try {
        // Check if the user exists
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', users_id)
            .single();

        if (userError || !user) {
            console.log('Nie znaleziono użytkownika:', userError || 'Brak użytkownika');
            return res.status(404).json({ error: 'Nie znaleziono użytkownika' });
        }

        // Insert post
        const { data: newPost, error: postError } = await supabase
            .from('posts')
            .insert([{
                users_id,
                content,
                created_at: new Date().toISOString(),
            }])
            .select('*') // Ensure the returned data is selected
            .single();

        if (postError) {
            console.log('Błąd dodawania posta:', postError);
            return res.status(500).json({ error: 'Błąd zapisu posta do bazy danych' });
        }

        console.log('Zapisano post:', newPost);
        res.status(201).json(newPost); // Return the saved post
    } catch (error) {
        console.error('Błąd serwera:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});


// Starting server
app.listen(3080, () => {
    console.log('Server started on port 3080');
});