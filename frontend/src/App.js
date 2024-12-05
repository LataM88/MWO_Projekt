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

// Function to get remaining time from the token
const getRemainingTime = (token) => {
    try {
        const decodedToken = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return decodedToken.exp - currentTime;
    } catch (error) {
        console.error('Błąd podczas dekodowania tokenu:', error);
        return 0;
    }
};

// Function to extend session if needed
const extendSession = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        const remainingTime = getRemainingTime(user.token);
        if (remainingTime <= 0) {
            localStorage.removeItem('user');
        } else if (remainingTime <= 900) {
            fetch('http://localhost:3080/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'jwt-token': user.token,
                },
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.token) {
                        // Save new token in localStorage
                        localStorage.setItem('user', JSON.stringify({ ...user, token: data.token }));
                    }
                })
                .catch((error) => console.error('Błąd przy przedłużaniu sesji:', error));
            console.log('NOWY TOKEN');
        }
    }
};

function AppContent() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");

    const [loading, setLoading] = useState(true); // Loading state
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Save current path to localStorage
        if (loggedIn) {
            localStorage.setItem('lastPath', location.pathname);
        }
    }, [location, loggedIn]);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.token) {
            console.log("Brak tokenu w localStorage");
            setLoggedIn(false);
            setLoading(false); // Stop loading if no token found
            return;
        }

        console.log("Token znaleziony:", user.token);

        fetch("http://localhost:3080/verify", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'jwt-token': user.token
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log("Odpowiedź z serwera:", data);
                if (data.message === 'success') {
                    setLoggedIn(true);
                    setEmail(user.email || "");

                    // After successful login, navigate to the last path
                    const lastPath = localStorage.getItem('lastPath') || '/';
                    navigate(lastPath);

                    // Now that the user is logged in, extend the session
                    extendSession();
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
                setLoading(false); // End loading after token verification
            });
    }, [navigate]); // Run this effect only once when the component mounts

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
            {loggedIn && <Navbar setLoggedIn={setLoggedIn} setEmail={setEmail} />}
            <Routes>
                <Route path="/activate" element={<GuestRoute loggedIn={loggedIn}><Activate /></GuestRoute>} />
                <Route path="/profile/:userId" element={<ProtectedRoute loggedIn={loggedIn}><Profile /></ProtectedRoute>} />
                <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
                <Route path="/login" element={<GuestRoute loggedIn={loggedIn}><Login setLoggedIn={setLoggedIn} setEmail={setEmail} /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute loggedIn={loggedIn}><Register /></GuestRoute>} />
                <Route path="/zapomnialesHasla" element={<GuestRoute loggedIn={loggedIn}><ForgotPassword /></GuestRoute>} />
                <Route path="/chat/:userId" element={<ProtectedRoute loggedIn={loggedIn}><Chat /></ProtectedRoute>} />
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

