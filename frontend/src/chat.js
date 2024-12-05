import React, { useState, useEffect } from 'react';
import './chat.css';

function Chat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('user')); // Pobieranie zalogowanego użytkownika

    useEffect(() => {
        const fetchUsers = async () => {
            const response = await fetch('http://localhost:3080/api/users');
            const data = await response.json();
            setUsers(data);
            setFilteredUsers(data);
            setActiveUser(data[0]);
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeUser) {
            console.log(`Fetching messages for ${currentUser.userId} and ${activeUser.id}`); // Dodaj logowanie
            const fetchMessages = async () => {
                const response = await fetch(`http://localhost:3080/messages/${currentUser.userId}/${activeUser.id}`);
                const data = await response.json();
                if (data && data.messages) {
                    setMessages(data.messages);
                } else {
                    setMessages([]); // Zainicjalizuj pustą tablicę, jeśli brak wiadomości
                }
            };
            fetchMessages();
        }
    }, [activeUser, currentUser.userId]);

    const handleSendMessage = async () => {
        if (message && activeUser) {
            const newMessage = {
                senderId: currentUser.userId, // ID zalogowanego użytkownika
                receiverId: activeUser.id,    // ID odbiorcy
                content: message,
            };

            const response = await fetch('http://localhost:3080/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage),
            });

            if (response.ok) {
                // Zaktualizuj wiadomości po wysłaniu
                setMessages(prevMessages => [...prevMessages, newMessage]);
                setMessage('');
            } else {
                console.error('Failed to send message:', response.statusText);
            }
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
            <div className="user-list">
                <div className="search">
                    <input
                        type="text"
                        placeholder="Wyszukaj użytkowników"
                        onChange={handleSearch}
                    />
                </div>
                <div className="users">
                    {filteredUsers.map((user, index) => (
                        <div
                            key={index}
                            className="user"
                            onClick={() => setActiveUser(user)}
                        >
                            <img src={user.image} alt={user.email} className="user-image" />
                            <div className="user-info">
                                <span>{user.imie + " " + user.nazwisko}</span>
                                <span className={`status ${user.status}`}>{user.status === 'online' ? 'Dostępny' : 'Niedostępny'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="chat-box">
                {activeUser ? (
                    <>
                        <div className="chat-header">
                            <img src={activeUser.image} alt={activeUser.email} className="user-image-onscreen" />
                            <h2>
                                Czatujesz z {activeUser.imie + " " + activeUser.nazwisko} ({activeUser.email})
                            </h2>
                            <span className="status">{activeUser.status === 'online' ? 'Dostępny' : 'Niedostępny'}</span>
                        </div>

                        <div className="messages">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.senderId === currentUser.userId ? 'sent' : 'received'}`}>
                                    <div className="message-text">
                                        {msg.content}
                                    </div>
                                    <div className="message-time">{new Date().toLocaleTimeString()}</div>
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
