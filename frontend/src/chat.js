import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './chat.css';

function Chat() {
    const { userId } = useParams(); // Get userId from the URL
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState({});
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);

    // Pobieranie danych użytkowników z API
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:3080/api/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);

                    // Find the user with the given userId from the URL
                    const selectedUser = data.find(user => user.id === parseInt(userId));
                    if (selectedUser) {
                        setActiveUser(selectedUser);
                    } else {
                        setActiveUser(null);
                    }
                } else {
                    console.error('Failed to fetch users:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, []);

    const handleSendMessage = () => {
        if (message && activeUser) {
            const newMessage = {
                text: message,
                sender: 'current_user@example.com', // Zamień na email zalogowanego użytkownika
                time: new Date().toLocaleTimeString().slice(0, 5),
            };

            setMessages((prevMessages) => ({
                ...prevMessages,
                [activeUser.id]: [...(prevMessages[activeUser.id] || []), newMessage],
            }));

            setMessage('');
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setFilteredUsers(users.filter(user =>
            user.email.toLowerCase().includes(query)
        ));
    };

    return (
        <div className="chat-container">
            {/* Left section - User list */}
            <div className="user-list">
                <div className="search">
                    <div>
                        <p>Ostatnie wiadomości</p>
                    </div>
                    <input
                        type="text"
                        placeholder="Wyszukaj użytkowników"
                        onChange={handleSearch}
                    />
                </div>
                <div className="users">
                    {(filteredUsers.length > 0 ? filteredUsers : users).map((user, index) => (
                        <div
                            key={index}
                            className="user"
                            onClick={() => setActiveUser(user)}
                        >
                            <img src={user.image} alt={user.email} className="user-image" />
                            <div className="user-info">
                                <span>{user.email}</span>
                                <span className={`status ${user.status}`}>{user.status === 'online' ? 'Dostępny' : 'Niedostępny'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right section - Chat with active user */}
            <div className="chat-box">
                {activeUser ? (
                    <>
                        <div className="chat-header">
                            <h2>
                                <img src={activeUser.image} alt={activeUser.email} className="user-image-onscreen" />
                                Czatujesz z {activeUser.email}
                            </h2>
                            <span className="status">{activeUser.status === 'online' ? 'Dostępny' : 'Niedostępny'}</span>
                        </div>

                        <div className="messages">
                            {messages[activeUser.email]?.map((msg, index) => (
                                <div key={index} className={`message ${msg.sender === activeUser.email ? 'sent' : 'received'}`}>
                                    <div className="ikona-message">
                                        <img src={activeUser.image || 'default-avatar.jpg'} alt={activeUser.email} className="ikona" />
                                    </div>
                                    <div className="message-text">
                                        {msg.text}
                                    </div>
                                    <div className="message-time">{msg.time}</div>
                                </div>
                            ))}
                        </div>

                        <div className="input-area">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Wpisz swoją wiadomość"
                            />
                            <button onClick={handleSendMessage}>Wyślij</button>
                        </div>
                    </>
                ) : (
                    <div className="no-active-user">
                        <p>Wybierz użytkownika, aby rozpocząć czat.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Chat;