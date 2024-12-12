import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './chat.css';

function Chat() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('user')); // Pobieranie zalogowanego użytkownika

    const ws = useRef(null);

    const getMessagesFromStorage = () => {
        try {
            const savedMessages = JSON.parse(localStorage.getItem('messages'));
            return Array.isArray(savedMessages) ? savedMessages : [];
        } catch (error) {
            console.error('Error parsing messages from localStorage:', error);
            return [];
        }
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:3080/api/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                    const selectedUser = data.find(user => user.id === parseInt(userId));
                    setActiveUser(selectedUser || null);
                } else {
                    console.error('Failed to fetch users:', response.statusText);
                }
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        fetchUsers();
    }, [userId]);

    useEffect(() => {
        if (activeUser) {
            const fetchMessages = async () => {
                try {
                    const response = await fetch(`http://localhost:3080/messages/${currentUser.userId}/${activeUser.id}`);
                    const data = await response.json();
                    if (data && Array.isArray(data.messages)) {
                        const allMessages = getMessagesFromStorage();
                        const updatedMessages = [...allMessages, ...data.messages];
                        localStorage.setItem('messages', JSON.stringify(updatedMessages));
                        setMessages(updatedMessages.filter(msg =>
                            (msg.senderId === currentUser.userId && msg.receiverId === activeUser.id) ||
                            (msg.senderId === activeUser.id && msg.receiverId === currentUser.userId)
                        ));
                    } else {
                        setMessages([]);
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            };
            fetchMessages();
        }
    }, [activeUser, currentUser.userId]);



    useEffect(() => {
        if (activeUser) {
            const savedMessages = getMessagesFromStorage();
            const userMessages = savedMessages.filter(msg =>
                (msg.senderId === currentUser.userId && msg.receiverId === activeUser.id) ||
                (msg.senderId === activeUser.id && msg.receiverId === currentUser.userId)
            );
            setMessages(userMessages);
        }
    }, [activeUser, currentUser]);

    useEffect(() => {
         ws.current = new WebSocket('ws://localhost:3080');

         ws.current.onopen = () => {
             console.log('WebSocket connected');
         };

         ws.current.onmessage = (event) => {
             const newMessage = JSON.parse(event.data);
             if (!newMessage.timestamp) {
                 newMessage.timestamp = new Date().toISOString();
             }

             setMessages((prevMessages) => {
                 const exists = prevMessages.some(
                     (msg) => msg.senderId === newMessage.senderId && msg.timestamp === newMessage.timestamp
                 );
                 if (!exists) {
                     const updatedMessages = [...prevMessages, newMessage];
                     localStorage.setItem('messages', JSON.stringify(updatedMessages));
                     return updatedMessages;
                 } else {
                     return prevMessages;
                 }
             });
         };

         return () => {
             if (ws.current) {
                 ws.current.close();
             }
         };
     }, []);


    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    const handleSendMessage = async () => {
        if (message && activeUser) {
            const timestamp = new Date().toISOString();

            const newMessage = {
                senderId: currentUser.userId,
                receiverId: activeUser.id,
                content: message,
                timestamp,
            };

            try {
                const response = await fetch('http://localhost:3080/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMessage),
                });

                if (response.ok) {
                    const updatedMessages = [...messages, newMessage];
                    localStorage.setItem('messages', JSON.stringify(updatedMessages));
                    setMessages(updatedMessages);
                    setMessage('');
                } else {
                    console.error('Failed to send message:', response.statusText);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    const handleKeyPress = (e) => {
        if(e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const handleSearch = (e) => {
        const query = e.target.value.toLowerCase();
        setFilteredUsers(users.filter(user => user.email.toLowerCase().includes(query)));
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
                    {(filteredUsers.length > 0 ? filteredUsers : users).map(user => (
                        <div
                            key={user.id}
                            className="user"
                            onClick={() => setActiveUser(user)}
                        >
                            <img src={user.image} alt={user.email} className="user-image" />
                            <div className="user-info">
                                <span>{user.imie + ' ' + user.nazwisko}</span>
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
                                Czatujesz z {activeUser.imie + ' ' + activeUser.nazwisko} ({activeUser.email})
                            </h2>
                            <span className="status">{activeUser.status === 'online' ? 'Dostępny' : 'Niedostępny'}</span>
                        </div>

                        <div className="messages">
                            {messages.map((msg, index) => {
                                const sender = users.find(user => user.id === msg.senderId);
                                return (
                                    <div key={index} className={`message ${msg.senderId === currentUser.userId ? 'sent' : 'received'}`}>
                                        {sender && (
                                            <div className="message-sender">
                                                <span className="sender-name">{sender.imie} {sender.nazwisko}</span>
                                            </div>
                                        )}
                                        <div className="message-text">{msg.content}</div>
                                        <div className="message-time">{formatTime(msg.timestamp)}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="input-area">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
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