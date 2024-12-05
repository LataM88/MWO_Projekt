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
                    <Route path="/login" element={<GuestRoute loggedIn={loggedIn}><Login setLoggedIn={setLoggedIn} setEmail={setEmail} /></GuestRoute>} />
                    <Route path="/register" element={<GuestRoute loggedIn={loggedIn}><Register /></GuestRoute>} />
                    <Route path="/zapomnialesHasla" element={<GuestRoute loggedIn={loggedIn}><ForgotPassword /></GuestRoute>} />
                    <Route path="/chat/:userId" element={<ProtectedRoute loggedIn={loggedIn}><Chat /></ProtectedRoute>} />
                    <Route path="/postboard" element={<PostBoard />} />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
