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
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from "./components/GuestRoute";
import PostBoard from './PostBoard';

import './App.css';

function AppContent() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true); // Loading state
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Save current path to sessionStorage
        if (loggedIn) {
            sessionStorage.setItem('lastPath', location.pathname);
        }
    }, [location, loggedIn]);

    useEffect(() => {
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
                    const lastPath = sessionStorage.getItem('lastPath') || '/';
                    navigate(lastPath);
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
    }, [navigate]); // Run this effect only once when the component mounts

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

    // Show loading screen if token is being verified
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
                <Route path="/activate" element={<GuestRoute loggedIn={loggedIn}><Activate /></GuestRoute>} />
                <Route path="/profile/:userId" element={<ProtectedRoute loggedIn={loggedIn}><Profile /></ProtectedRoute>} />
                <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
                <Route path="/login" element={<GuestRoute loggedIn={loggedIn}><Login setLoggedIn={setLoggedIn} setEmail={setEmail} /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute loggedIn={loggedIn}><Register /></GuestRoute>} />
                <Route path="/zapomnialesHasla" element={<GuestRoute loggedIn={loggedIn}><ForgotPassword /></GuestRoute>} />
                <Route path="/chat/:userId" element={<ProtectedRoute loggedIn={loggedIn}><Chat /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute loggedIn={loggedIn}><Chat /></ProtectedRoute>} />
                <Route path="/postboard" element={<ProtectedRoute loggedIn={loggedIn}><PostBoard /></ProtectedRoute>} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;


