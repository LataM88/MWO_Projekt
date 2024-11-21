import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Navbar from './components/navbar';
import Register from './register';  // Import komponentu rejestracji
import Profile from './Profile';
import Chat from './chat';
import './App.css';
import ForgotPassword from './zapomnialesHasla';
import Activate from './activate';
import { useEffect, useState } from 'react';

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [email, setEmail] = useState("");

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("user"));

        if (!user || !user.token) {
            setLoggedIn(false);
            return;
        }

        fetch("http://localhost:3080/verify", {
            method: "POST",
            headers: {
                'jwt-token': user.token
            }
        })
        .then(r => r.json())
        .then(r => {
            setLoggedIn('success' === r.message);
            setEmail(user.email || "");
        });
    }, []);

    return (
        <div className="App">
            <BrowserRouter>
                {loggedIn && <Navbar setLoggedIn={setLoggedIn} setEmail={setEmail} />}
                <Routes>
                    <Route path="/profile/:userId" element={<Profile />} />
                    <Route path="/activate" element={<Activate />} />
                    <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>} />
                    <Route path="/login" element={<Login setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
                    <Route path="/register" element={<Register />} /> {/* Nowa trasa */}
                    <Route path="/zapomnialesHasla" element={<ForgotPassword />} />
                    <Route path="/chat" element={<Chat />} /> {/* Nowa trasa do chatu */}
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;