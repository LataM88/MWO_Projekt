import { BrowserRouter, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
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

function AppContent() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false); // Loading state only for protected routes
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Save current path to sessionStorage
        if (loggedIn) {
            sessionStorage.setItem('lastPath', location.pathname);
        }
    }, [location, loggedIn]);

    const verifyToken = () => {
        setLoading(true);
        console.log("Sprawdzanie tokenu...");

        fetch("http://localhost:3080/verify", {
            method: "POST",
            credentials: "include", // To ustawienie zapewnia przesyłanie ciasteczek
        })
            .then(response => response.json())
            .then(data => {
                console.log("Odpowiedź z serwera:", data);
                if (data.message === 'success') {
                    setLoggedIn(true);
                    setEmail(data.email || "");
                } else {
                    setLoggedIn(false);
                    navigate("/login");
                }
            })
            .catch(error => {
                console.error('Błąd weryfikacji tokenu:', error);
                setLoggedIn(false);
                navigate("/login");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const handleLogout = () => {
        fetch("http://localhost:3080/logout", {
            method: "POST",
            credentials: "include", // Przesyłanie cookies
        })
            .then(() => {
                setLoggedIn(false);
                setEmail("");
                navigate("/login");
            })
            .catch(error => {
                console.error("Błąd podczas wylogowania:", error);
            });
    };

    // Show loading screen during token verification
    if (loading) {
        return (
            <div className="loading-screen">
                <h2>Loading...</h2>
            </div>
        );
    }

    return (
        <div className="App">
            {loggedIn && <Navbar setLoggedIn={setLoggedIn} setEmail={setEmail} onLogout={handleLogout} />}
            <Routes>
                {/* Ścieżki dostępne dla niezalogowanych użytkowników */}
                <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
                <Route path="/login" element={<Login setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
                <Route path="/register" element={<Register />} />
                <Route path="/zapomnialesHasla" element={<ForgotPassword />} />

                {/* Ścieżki dostępne tylko dla zalogowanych użytkowników */}
                <Route
                    path="/profile/:userId"
                    element={<ProtectedComponent component={<Profile />} verifyToken={verifyToken} />}
                />
                <Route
                    path="/chat/:userId"
                    element={<ProtectedComponent component={<Chat />} verifyToken={verifyToken} />}
                />
                <Route
                    path="/chat"
                    element={<ProtectedComponent component={<Chat />} verifyToken={verifyToken} />}
                />
                <Route
                    path="/postboard"
                    element={<ProtectedComponent component={<PostBoard />} verifyToken={verifyToken} />}
                />
                <Route
                    path="/activate"
                    element={<ProtectedComponent component={<Activate />} verifyToken={verifyToken} />}
                />
            </Routes>
        </div>
    );
}

function ProtectedComponent({ component, verifyToken }) {
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        verifyToken();
        setChecked(true);
    }, [verifyToken]);

    if (!checked) {
        return (
            <div className="loading-screen">
                <h2>Loading...</h2>
            </div>
        );
    }

    return component;
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
