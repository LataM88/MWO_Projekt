import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import chatImage from '.././img/chat-round-dots-svgrepo-com.png';
import './userPanel.css';

const UserPanel = () => {
    const [users, setUsers] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const buttonRef = useRef(null);
    const navigate = useNavigate(); // Hook do nawigacji

    // Pobieranie danych zalogowanego użytkownika z localStorage
    const storedData = localStorage.getItem('user');
    const userData = storedData ? JSON.parse(storedData) : null;
    const loggedInUserEmail = userData ? userData.email : null;

    // Pobieranie listy użytkowników
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:3080/api/users');
                if (response.ok) {
                    const data = await response.json();
                    const filteredUsers = data.filter(user => user.email !== loggedInUserEmail);
                    setUsers(filteredUsers);
                } else {
                    console.error("Failed to fetch users:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, [loggedInUserEmail]);

    // Przełączanie widoczności panelu
    const togglePanel = () => {
        setIsVisible(!isVisible);
    };

    // Obsługa kliknięcia w użytkownika
    const handleUserClick = (id) => {
        navigate(`/profile/${id}`); // Nawigacja do profilu użytkownika na podstawie id
    };

    return (
        <div className="userr-panel-container">
            <button className="userr-panel-button" onClick={togglePanel} ref={buttonRef}>
                <img className="white-image" src={chatImage} alt="Userr Panel Toggle" />
            </button>

            <div className={`userr-panel ${isVisible ? 'show' : 'hide'}`} style={{ top: `${buttonRef.current?.offsetTop + buttonRef.current?.offsetHeight}px` }}>
                <ul className="userr-list">
                    {users.length === 0 ? (
                        <li className="no-users">No users found.</li>
                    ) : (
                        users.map((user) => (
                            <li key={user.id} onClick={() => handleUserClick(user.id)}>
                                {user.imie + " " + user.nazwisko} {/* Wyświetlanie imie, nazwisko, ale przekazywanie id */}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default UserPanel;

