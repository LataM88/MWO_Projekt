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
//dwa poniższe komponenty pozwalają na zablokowanie dostępu zalogowanym do strony logowania i niezalogowanym do całej strony
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from "./components/GuestRoute";

import './App.css';

const getRemainingTime = (token) => {
    try {
        const decodedToken = JSON.parse(atob(token.split('.')[1])); // Dekodowanie części payload JWT
        const currentTime = Math.floor(Date.now() / 1000); // Czas w sekundach
        return decodedToken.exp - currentTime; // Pozostały czas w sekundach
    } catch (error) {
        console.error('Błąd podczas dekodowania tokenu:', error);
        return 0; // Jeśli coś poszło nie tak, zakładamy, że token jest nieważny
    }
};
const extendSession = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        const remainingTime = getRemainingTime(user.token);

        // Odnów sesję tylko, jeśli pozostało 15 minut lub mniej
        if (remainingTime <= 900) {
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
                        // Zapisz nowy token w localStorage
                        localStorage.setItem('user', JSON.stringify({ ...user, token: data.token }));
                    }
                })
                .catch((error) => console.error('Błąd przy przedłużaniu sesji:', error));
        }
    }
};


function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");

    const [active, setActive] = useState(false);

    const extendSessionOnActivity = () => {
        setActive(true);
        extendSession();  // Wywołanie funkcji przedłużającej sesję
    };

    useEffect(() => {
        console.log("useEffect uruchomiony");  // Dodaj ten log
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.token) {
            console.log("Brak tokenu w localStorage");
            setLoggedIn(false);
            return;
        }

        console.log("Token znaleziony:", user.token);  // Dodaj ten log

        fetch("http://localhost:3080/verify", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'jwt-token': user.token
            }
        })
            .then(response => response.json())
            .then(data => {
                console.log("Odpowiedź z serwera:", data);  // Dodaj ten log
                if (data.message === 'success') {
                    setLoggedIn(true);
                    setEmail(user.email || "");
                } else {
                    setLoggedIn(false);
                }
            })
            .catch(error => {
                console.error('Błąd weryfikacji tokenu:', error);
                setLoggedIn(false);
            });
    }, []);

    return (
        <div className="App" onClick={extendSessionOnActivity}>
            <BrowserRouter>
                {/* Wyświetlanie Navbar tylko, gdy użytkownik jest zalogowany */}
                {loggedIn && <Navbar setLoggedIn={setLoggedIn} setEmail={setEmail} />}

                <Routes>
                    <Route path="/activate" element={<GuestRoute loggedIn={loggedIn}><Activate /></GuestRoute>} />
                    <Route path="/profile/:userId" element={<ProtectedRoute loggedIn={loggedIn}><Profile /></ProtectedRoute>} />
                    <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn} />} />
                    <Route path="/login" element={<GuestRoute loggedIn={loggedIn}><Login setLoggedIn={setLoggedIn} setEmail={setEmail} /></GuestRoute>} />
                    <Route path="/register" element={<GuestRoute loggedIn={loggedIn}><Register /></GuestRoute>} />
                    <Route path="/zapomnialesHasla" element={<GuestRoute loggedIn={loggedIn}><ForgotPassword /></GuestRoute>} />
                    <Route path="/chat" element={<ProtectedRoute loggedIn={loggedIn}><Chat /></ProtectedRoute>} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
