import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import multer from 'multer';
import sharp from 'sharp';
import cookieParser from 'cookie-parser';

const upload = multer({ storage: multer.memoryStorage() });

const supabaseUrl = 'https://qgjrvrjgmewqffywfxhh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFnanJ2cmpnbWV3cWZmeXdmeGhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA4MTExMDMsImV4cCI6MjA0NjM4NzEwM30.hrnOev0tRUM9cUNugQu5BARLBrm3VbQS1VsCy4ZkMzM';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const jwtSecretKey = 'dsfdsfsdfdsvcsvdfgefg'; // JWT secret key
const refreshTokenSecretKey = 'sdnfdsnafjndjklehewhfjk';

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(cookieParser());

const authenticateToken = (req, res, next) => {
    const token = req.cookies.accessToken; // Pobranie tokenu z ciasteczka

    if (!token) {
        return res.status(401).json({ message: 'Brak tokenu' });
    }

    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Nieprawidłowy lub wygasły token' });
        }

        req.user = decoded; // Dodanie informacji o użytkowniku do żądania
        next();
    });
};

// WebSocket connection handler
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Listen for incoming messages from client
    ws.on('message', (message) => {
        console.log('Received message:', message);

        // Broadcast the message to all clients except the sender
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === client.OPEN) {
                client.send(JSON.stringify({ senderId, receiverId, content }));
            }
        });
    });

    // Handle client disconnection
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
// Main API route
app.get('/', (_req, res) => {
    res.send('Auth API.\nPlease use POST /auth & POST /register for authentication');
});

app.use((req, res, next) => {
    console.log('Ciasteczka:', req.cookies); // Sprawdź wszystkie ciasteczka
    next();
});

//Tokeny
const createAccessToken = (userId, email) => {
    const payload = { userId, email };
    console.log('tworzenie accestokena')
    return jwt.sign(payload, jwtSecretKey, { expiresIn: '15m' }); // Ważność: 15 minut
};

const createRefreshToken = (userId, email) => {
    const payload = { userId, email };
    console.log('tworzenie refreshtokena')
    return jwt.sign(payload, refreshTokenSecretKey, { expiresIn: '1h' }); // Ważność: 1 godzina
};

app.post('/logout', (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Wylogowano' });
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { email, password, imie, nazwisko } = req.body;

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
            .insert([{ imie, nazwisko, email, password: hashedPassword, isActive: false, activationCode, activationExpires }]);

        if (error) {
            console.error('Error inserting user:', error);
            return res.status(500).json({ message: 'Błąd rejestracji' });
        }

        // Wysyłanie linku aktywacyjnego
        const activationLink = `http://localhost:3080/activate?code=${activationCode}&email=${email}&imie=${imie}&nazwisko=${nazwisko}`;



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
        console.log('Błąd podczas pobierania użytkownika lub użytkownik nie istnieje');
        return res.status(400).json({ message: 'Użytkownik nie istnieje.' });
    }

    if (!user.isActive) {
        console.log('Konto nie zostało aktywowane');
        return res.status(403).json({ message: 'Konto nie zostało aktywowane. Sprawdź swój e-mail, aby je aktywować.' });
    }

    const result = await bcrypt.compare(password, user.password);
    if (!result) {
        console.log('Nieprawidłowe hasło');
        return res.status(401).json({ message: 'Nieprawidłowe hasło.' });
    }
    // Sprawdzenie czasu ostatniej wysyłki kodu
    const currentTime = new Date(); // Czas lokalny serwera
    const lastSent = user.lastTwoFactorSent ? new Date(user.lastTwoFactorSent) : null;

    const currentTimeInSeconds = Math.floor(currentTime.getTime() / 1000);
    const lastSentInSeconds = lastSent ? Math.floor(lastSent.getTime() / 1000) : null;
    const cooldownPeriod = 15 * 1000; // 15 sekund w milisekundach
    const timeDifference = lastSentInSeconds ? currentTimeInSeconds - lastSentInSeconds : null;
    console.log('Różnica w czasie w sekundach:', timeDifference);
    if (lastSentInSeconds && timeDifference < cooldownPeriod / 1000) {  // Sprawdzamy w sekundach
        const timeRemaining = Math.ceil((cooldownPeriod / 1000) - timeDifference);
        console.log(`Cooldown aktywny, pozostało ${timeRemaining} sekund`);
        return res.status(429).json({ message: `Proszę poczekać ${timeRemaining} sekund przed wysłaniem nowego kodu.` });
    }
    // Generowanie kodu 2FA
    const twoFactorCode = generateTwoFactorCode();
    console.log('Generowanie nowego kodu 2FA:', twoFactorCode);
    // Zaktualizowanie pola `lastTwoFactorSent` i zapisanie nowego kodu
    const { error: updateError } = await supabase
        .from('users')
        .update({
            twoFactorCode,
            lastTwoFactorSent: currentTime.toISOString() // Zaktualizowanie czasu wysyłki w formacie ISO (UTC)
        })
        .eq('id', user.id);
    if (updateError) {
        console.error('Błąd aktualizacji kodu 2FA:', updateError);
        return res.status(500).json({ message: 'Błąd serwera podczas generowania kodu 2FA' });
    }
    // Wysyłanie kodu 2FA e-mailem (jedno wywołanie)
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
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (err) => {
        if (err) {
            console.error('Błąd wysyłania kodu 2FA:', err);
            return res.status(500).json({ message: 'Błąd wysyłania kodu 2FA' });
        }

        console.log('Kod 2FA został wysłany');
        res.status(200).json({ message: 'success', userId: user.id });
    });
});


// Endpoint do weryfikacji kodu 2FA
app.post('/verify-2fa', async (req, res) => {
    const { userId, twoFactorCode } = req.body;

    try {
        // Pobranie użytkownika z bazy danych
        const { data: user, error } = await supabase
            .from('users')
            .select('twoFactorCode, email')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return res.status(400).json({ message: 'Nieprawidłowy użytkownik.' });
        }

        // Weryfikacja kodu 2FA
        if (user.twoFactorCode !== twoFactorCode) {
            return res.status(401).json({ message: 'Nieprawidłowy kod weryfikacyjny.' });
        }

        // Usunięcie kodu 2FA po pomyślnej weryfikacji
        const { error: updateError } = await supabase
            .from('users')
            .update({ twoFactorCode: null })
            .eq('id', userId);

        if (updateError) {
            console.error('Błąd usuwania kodu 2FA:', updateError);
            return res.status(500).json({ message: 'Błąd serwera' });
        }

        // Generowanie tokenów
        const accessToken = createAccessToken(userId, user.email);
        const refreshToken = createRefreshToken(userId, user.email);

        // Ustawienie tokenów w ciasteczkach
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: true, // Dla lokalnego środowiska (HTTP)
            sameSite: 'None', // Albo 'Lax' w zależności od potrzeb
            maxAge: 15 * 60 * 1000, // 15 minut
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true, // Dla lokalnego środowiska (HTTP)
            sameSite: 'None', // Albo 'Lax' w zależności od potrzeb
            maxAge: 60 * 60 * 1000, // 1 godzina
        });
        console.log("log przed wysłaniem odpowiedzi z verify-f2a")
        // Zwrócenie odpowiedzi z powodzeniem
        res.status(200).json({ message: 'Weryfikacja pomyślna' });
        console.log("log po wysłaniem odpowiedzi z verify-f2a")
    } catch (err) {
        console.error('Błąd weryfikacji 2FA:', err);
        res.status(500).json({ message: 'Błąd serwera' });
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
            .select('activationCode, isActive, imie, nazwisko, activationExpires')
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

        res.redirect(`http://localhost:3000/activate?status=success&imie=${user.imie}&nazwisko=${user.nazwisko}`);
    } catch (err) {
        console.error('Unhandled error:', err);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

app.get('/users', async (req, res) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, imie, nazwisko, isActive, opis');

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

    const fileExtension = 'jpeg';
    const fileName = `${userId}.${fileExtension}`;

    try {

        const resizedImageBuffer = await sharp(file.buffer)
            .resize(300, 300, { fit: sharp.fit.cover })
            .toFormat(fileExtension)
            .toBuffer();

        // Sprawdź, czy istnieje plik w Supabase
        const { data: existingFile, error: checkError } = await supabase
            .storage
            .from('profile-image')
            .list('', { search: fileName });

        if (checkError) {
            console.error('Error checking existing file in Supabase:', checkError);
            return res.status(500).json({ message: 'Error checking file existence in Supabase.' });
        }

        // Jeśli plik istnieje, usuń go
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

        // Prześlij nowy plik
        const { data, error } = await supabase.storage
            .from('profile-image')
            .upload(fileName, resizedImageBuffer, { contentType: `image/${fileExtension}` });

        if (error) {
            console.error('Error uploading image to Supabase:', error);
            return res.status(500).json({ message: 'Błąd przesyłania obrazu do Supabase.' });
        }

        const imageUrl = `${supabaseUrl}/storage/v1/object/public/profile-image/${fileName}?${new Date().getTime()}`;

        // Zaktualizuj profil użytkownika
        const { error: updateError } = await supabase
            .from('users')
            .update({ image: imageUrl })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating user profile image:', updateError);
            return res.status(500).json({ message: 'Błąd aktualizacji profilu użytkownika.' });
        }

        res.status(200).json({ message: 'Zdjęcie profilowe zostało pomyślnie przesłane.', imageUrl });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ message: 'Nieoczekiwany błąd serwera.' });
    }
});



app.post('/verify', (req, res) => {
    console.log('rozpoczęcie verify');
    const token = req.cookies['accessToken'];


    jwt.verify(token, jwtSecretKey, (err, decoded) => {
        if (err) {
            // Jeśli access token jest nieważny, próbujemy go odświeżyć
            console.log('Token wygasł, próbuję odświeżyć token...');
            const refreshToken = req.cookies['refreshToken'];
            if (!refreshToken) {
                return res.status(401).json({ message: 'Brak refresh tokenu' });
            }

            // Weryfikacja refresh tokenu
            jwt.verify(refreshToken, refreshTokenSecretKey, (refreshErr, refreshDecoded) => {
                if (refreshErr) {
                    return res.status(403).json({ message: 'Refresh token jest nieprawidłowy lub wygasł' });
                }

                // Jeśli refresh token jest ważny, tworzymy nowy access token
                const newAccessToken = createAccessToken(refreshDecoded.userId, refreshDecoded.email);

                // Ustawienie nowego ciasteczka z access tokenem
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: false, // Użyj `true` w produkcji
                    sameSite: 'None',
                    maxAge: 15 * 60 * 1000, // 15 minut
                });

                console.log('Odświeżono access token');
                // Powtarzamy weryfikację z nowym tokenem
                jwt.verify(newAccessToken, jwtSecretKey, (finalErr, finalDecoded) => {
                    if (finalErr) {
                        return res.status(401).json({ message: 'Nieprawidłowy lub wygasły token' });
                    }

                    console.log('Token zweryfikowany po odświeżeniu, decoded:', finalDecoded);
                    res.status(200).json({ message: 'success', userId: finalDecoded.userId });
                });
            });
        } else {
            console.log('Token zweryfikowany, decoded:', decoded);
            res.status(200).json({ message: 'success', userId: decoded.userId });
        }
    });
});


// Endpoint do przedłużenia sesji
app.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies['refreshToken'];

    if (!refreshToken) {
        return res.status(401).json({ message: 'Brak refresh tokenu' });
    }

    jwt.verify(refreshToken, refreshTokenSecretKey, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Refresh token jest nieprawidłowy lub wygasł' });
        }

        // Tworzenie nowego accessToken
        const newAccessToken = createAccessToken(decoded.userId, decoded.email);

        // Ustawienie nowego ciasteczka z accessToken
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'None',
            maxAge: 15 * 60 * 1000, // Ważność: 15 minut
        });

        res.status(200).json({ message: 'Access token odświeżony' });
    });
});

app.post('/messages', async (req, res) => {
    const { senderId, receiverId, content } = req.body;

    try {
        const { data, error } = await supabase
            .from('messages')
            .insert([{ sender_id: senderId, receiver_id: receiverId, content }]);

        if (error) {
            console.error('Error inserting message:', error.message);
            return res.status(500).json({ message: 'Error inserting message', error: error.message });
        }

        // Broadcast the message to the receiver using WebSocket
        wss.clients.forEach(client => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify({ senderId, receiverId, content }));
            }
        });

        res.status(201).json({ message: 'Message sent successfully', data });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ message: 'Unexpected error', error: err });
    }
});

app.get('/messages/:userId/:receiverId', async (req, res) => {
    let { userId, receiverId } = req.params;

    // Konwersja userId i receiverId na liczby
    userId = parseInt(userId, 10);  // Konwersja na liczbę
    receiverId = parseInt(receiverId, 10);  // Konwersja na liczbę

    try {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .in('sender_id', [userId, receiverId])
            .in('receiver_id', [userId, receiverId]);

        if (error) {
            console.error('Error fetching messages:', error);
            return res.status(500).json({ message: 'Error fetching messages', error });
        }

        res.status(200).json({ messages: data });
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ message: 'Unexpected error', error: err });
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
                ),
                comments:comments (
                    id,
                    content,
                    created_at,
                    user_id,
                    users:users (
                        imie,
                        nazwisko,
                        email,
                        image
                    )
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('Błąd podczas pobierania postów:', error);
            return res.status(500).json({ error: 'Błąd pobierania postów' });
        }

        // Mapowanie danych do odpowiedniego formatu
        const posts = data.map(post => ({
            id: post.id,
            content: post.content,
            created_at: post.created_at,
            user: post.users ? {
                email: post.users.email || 'Nieznany użytkownik',
                imie: post.users.imie || 'Nieznane imię',
                nazwisko: post.users.nazwisko || 'Nieznane nazwisko',
                image: post.users.image || 'default-avatar.jpg',
            } : null,
            comments: post.comments.map(comment => ({
                id: comment.id,
                content: comment.content,
                created_at: comment.created_at,
                user: comment.users ? {
                    imie: comment.users.imie || 'Anonim',
                    nazwisko: comment.users.nazwisko || 'Anonim',
                    email: comment.users.email || 'Nieznany użytkownik',
                    image: comment.users.image || 'default-avatar.jpg',
                } : null
            }))
        }));

        res.status(200).json(posts);
    } catch (error) {
        console.log('Błąd serwera:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// Endpoint do pobierania postów konkretnego użytkownika (profil)
app.get('/api/posts/:userId', async (req, res) => {
    const { userId } = req.params;

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
            .eq('users_id', userId) // Filtrowanie po userId
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Błąd podczas pobierania postów użytkownika:', error);
            return res.status(500).json({ error: 'Błąd pobierania postów użytkownika' });
        }

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
        console.error('Błąd serwera podczas pobierania postów użytkownika:', error);
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
// Endpoint do pobierania komentarzy do postów
app.get('/api/comments', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                id,
                content,
                created_at,
                post_id,
                users:users (
                    email,
                    imie,
                    nazwisko,
                    image
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.log('Błąd podczas pobierania komentarzy:', error);
            return res.status(500).json({ error: 'Błąd pobierania komentarzy' });
        }

        const comments = data.map(comment => ({
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            post_id: comment.post_id,
            user: comment.users ? {
                email: comment.users.email || 'Nieznany użytkownik',
                imie: comment.users.imie || 'Nieznane imię',
                nazwisko: comment.users.nazwisko || 'Nieznane nazwisko',
                image: comment.users.image || 'default-avatar.jpg',
            } : null
        }));

        res.status(200).json(comments);
    } catch (error) {
        console.log('Błąd serwera:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// Endpoint do dodawania komentarzy
app.post('/api/comments', async (req, res) => {
    const { post_id, user_id, content } = req.body;

    if (!post_id || !user_id || !content) {
        console.log('Brak wymaganych pól:', { post_id, user_id, content });
        return res.status(400).json({ error: 'Brakuje wymaganych pól: post_id, user_id, content' });
    }

    try {
        // Insert comment
        const { data: newComment, error: commentError } = await supabase
            .from('comments')
            .insert([{
                post_id,
                user_id,
                content,
                created_at: new Date().toISOString(),
            }])
            .select('*')
            .single();

        if (commentError) {
            console.log('Błąd dodawania komentarza:', commentError);
            return res.status(500).json({ error: 'Błąd zapisu komentarza do bazy danych' });
        }

        console.log('Zapisano komentarz:', newComment);
        res.status(201).json(newComment); // Zwracamy zapisany komentarz
    } catch (error) {
        console.error('Błąd serwera:', error);
        res.status(500).json({ error: 'Wewnętrzny błąd serwera' });
    }
});

// Endpoint to update the user's last active time

app.post('/api/activity', async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ message: 'Brakuje identyfikatora użytkownika.' });
    }

    try {
        // Get current time in UTC and adjust it by one hour
        const now = new Date(new Date().getTime() + 3600000).toISOString(); // +3600000 adds 1 hour in milliseconds
        await supabase
            .from('users')
            .update({ last_active: now })
            .eq('id', userId);

        res.status(200).json({ message: 'Status użytkownika został zaktualizowany.' });
    } catch (error) {
        console.error('Błąd podczas aktualizacji aktywności użytkownika:', error);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});

// Endpoint to check if a user is online
app.get('/api/isonline/:userId', async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.status(400).json({ message: 'Brakuje identyfikatora użytkownika.' });
    }

    try {
        // Fetch user data from the database
        const { data, error } = await supabase
            .from('users')
            .select('last_active')
            .eq('id', userId)
            .single();

        if (error) {
            return res.status(500).json({ message: 'Błąd podczas pobierania danych.' });
        }

        // Convert last active time to UTC Date object
        const lastActiveUTC = new Date(data.last_active);

        // Get the current server time in UTC
        const now = new Date().toISOString();

        // Calculate the difference in seconds
        const timeDiffSeconds = (new Date() - lastActiveUTC) / 1000;
        const isOnline = timeDiffSeconds  < 60; // Last active within the last 1 minutes

        // Send the result as a response
        res.status(200).json({ isOnline });
    } catch (error) {
        console.error('Błąd podczas sprawdzania statusu online użytkownika:', error);
        res.status(500).json({ message: 'Błąd serwera.' });
    }
});





// Starting server
server.listen(3080, () => {
    console.log('Server started on port 3080');
});