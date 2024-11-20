import React, { useState } from 'react';
import './chat.css';

function Chat() {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState({});
    const [users] = useState([
        { email: 'user1@example.com', status: 'online', image: 'user1.jpg' },
        { email: 'user2@example.com', status: 'offline', image: 'user2.jpg' },
        { email: 'user3@example.com', status: 'online', image: 'user3.jpg' },
    ]);

    const [registeredUsers] = useState([
        'user1@example.com',
        'user2@example.com',
        'user3@example.com'
    ]);

    const [filteredUsers, setFilteredUsers] = useState(users.filter(user => registeredUsers.includes(user.email)));
    const [activeUser, setActiveUser] = useState(filteredUsers[0] || {});

    const handleSendMessage = () => {
        if (message) {
            const newMessage = {
                text: message,
                sender: 'user3@example.com',
                time: new Date().toLocaleTimeString().slice(0, 5),
            };

            setMessages((prevMessages) => ({
                ...prevMessages,
                [activeUser.email]: [...(prevMessages[activeUser.email] || []), newMessage]
            }));

            setMessage('');
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setFilteredUsers(users.filter(user =>
            registeredUsers.includes(user.email) && user.email.toLowerCase().includes(query)
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
                    {filteredUsers.map((user, index) => (
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
                <div className="chat-header">
                    <h2>
                        <img src={activeUser.image} alt={activeUser.email} className="ikona-small-header" />
                        Czatujesz z {activeUser.email}
                    </h2>
                    <span className="status">{activeUser.status === 'online' ? 'Dostępny' : 'Niedostępny'}</span>
                </div>

                <div className="messages">
                    {messages[activeUser.email]?.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender === activeUser.email ? 'sent' : 'received'}`}>
                            <div className="ikona-message">
                                <img src={activeUser.image} alt={activeUser.email} className="ikona" />
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
            </div>
        </div>
    );
}

export default Chat;
