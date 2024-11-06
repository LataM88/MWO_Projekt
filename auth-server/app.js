import express from 'express';
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

// Start server
app.listen(3080, () => {
    console.log('Server is running on port 3080');
});