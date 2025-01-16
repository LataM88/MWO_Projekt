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
import ActivityMonitor from './components/ActivityMonitor';

import './App.css';

function AppContent() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    const verifyToken = () => {
        console.log("Sprawdzanie tokenu...");

        return fetch("http://localhost:3080/verify", {
            method: "POST",
            credentials: "include", // Zapewnia przesyłanie ciasteczek (accessToken)
        })
            .then(async (response) => {
                if (response.status === 401) {
                    console.log("Access token wygasł, próbuję odświeżyć...");

                    // Próba odświeżenia tokena
                    const refreshResponse = await fetch("http://localhost:3080/refresh", {
                        method: "POST",
                        credentials: "include",
                    });

                    if (!refreshResponse.ok) {
                        console.log("Nie udało się odświeżyć tokena, przekierowanie na login.");
                        setLoggedIn(false);
                        navigate("/login");
                        return false;
                    }

                    // Jeśli token został odświeżony, ponownie wywołujemy /verify
                    return fetch("http://localhost:3080/verify", {
                        method: "POST",
                        credentials: "include",
                    }).then(res => res.json());
                }

                return response.json();
            })
            .then(data => {
                console.log("Odpowiedź z serwera:", data);
                if (data.message === "success") {
                    setLoggedIn(true);
                    setEmail(data.email || "");
                    return true;
                } else {
                    setLoggedIn(false);
                    navigate("/login");
                    return false;
                }
            })
            .catch(error => {
                console.error("Błąd weryfikacji tokenu:", error);
                setLoggedIn(false);
                navigate("/login");
                return false;
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

    return (
        <div className="App">
            {loggedIn && <Navbar setLoggedIn={setLoggedIn} setEmail={setEmail} onLogout={handleLogout} />}
            {loggedIn && <ActivityMonitor/>}
            <Routes>
                {/* Ścieżki dostępne dla wszystkich użytkowników */}
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
    const navigate = useNavigate();

    useEffect(() => {
        const verify = async () => {
            const isValid = await verifyToken();
            if (!isValid) {
                navigate("/login");
            }
            setChecked(isValid);
        };
        verify();
    }, [verifyToken, navigate]);

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
