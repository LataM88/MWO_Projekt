import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Home from './home';
import Login from './login';
import Navbar from './components/navbar';
import Register from './register';
import Profile from './Profile';
import Chat from './chat';
import ForgotPassword from './zapomnialesHasla';
import Activate from './activate';
import PostBoard from './PostBoard';

import './App.css';

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        // Sprawdzanie, czy token użytkownika jest obecny
        if (!user || !user.token) {
            setLoggedIn(false);
            return;
        }

        // Weryfikacja tokenu użytkownika
        fetch("http://localhost:3080/verify", {
            method: "POST",
            headers: {
                'jwt-token': user.token
            }
        })
        .then(response => response.json())
        .then(data => {
            setLoggedIn(data.message === 'success');
            setEmail(user.email || "");
        })
        .catch(error => {
            console.error('Błąd weryfikacji tokenu:', error);
            setLoggedIn(false);
        });
    }, []);

    return (
        <div className="App">
            <BrowserRouter>
                {/* Wyświetlanie Navbar tylko, gdy użytkownik jest zalogowany */}
                {loggedIn && <Navbar setLoggedIn={setLoggedIn} setEmail={setEmail} />}

                <Routes>
                    <Route path="/activate" element={<Activate />} />
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
                    <Route path="/login" element={<Login setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/zapomnialesHasla" element={<ForgotPassword />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/postboard" element={<PostBoard />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
