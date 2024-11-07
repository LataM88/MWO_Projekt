import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from './home';
import Login from './login';
import Register from './register';  // Import komponentu rejestracji
import './App.css';
<<<<<<< HEAD
import ForgotPassword from './zapomnialesHasla'
=======
import ForgotPassword from './zapomnialesHasla';
>>>>>>> c7ccb1b767c529d585140404884bafe37045b464
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
                <Routes>
                    <Route path="/zapomnialesHasla" element={<ForgotPassword />} />
                    <Route path="/" element={<Home email={email} loggedIn={loggedIn} setLoggedIn={setLoggedIn}/>} />
                    <Route path="/login" element={<Login setLoggedIn={setLoggedIn} setEmail={setEmail} />} />
                    <Route path="/register" element={<Register />} /> {/* Nowa trasa */}
<<<<<<< HEAD
=======
                    <Route path="/zapomnialesHasla" element={<ForgotPassword />} />
>>>>>>> c7ccb1b767c529d585140404884bafe37045b464
                </Routes>
            </BrowserRouter>
        </div>
    );
}

export default App;
