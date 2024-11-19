import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './navbar.css';


const Navbar = ({ setLoggedIn, setEmail }) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [time, setTime] = useState(new Date().toLocaleTimeString());

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const navigate = useNavigate();

    const logOut = () => {
        localStorage.removeItem("user");
        setLoggedIn(false);
        setEmail("");
    };

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <nav className="navbar">
            <div className="logo">
                <Link to="/" className="logolink">
                    <span className="line">Strona</span>
                    <span className="line">Główna</span>
                </Link>
            </div>

            <div className="clock">{time}</div>

            <ul className="nav-links">
                <li className="dropdown" onMouseEnter={toggleDropdown} onMouseLeave={toggleDropdown}>
                    <p>MENU</p>
                    {isDropdownOpen && (
                        <ul className="dropdown-menu">
                            <li><Link to="/" className="dropdown-item">Mój Profil</Link></li>
                            <li><Link to="/" className="dropdown-item">Opcje</Link></li>
                            <li>
                                <Link
                                    to="/login"
                                    className="logout-link"
                                    onClick={logOut}
                                >
                                    Wyloguj
                                </Link>
                            </li>
                        </ul>
                    )}
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
