import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './chat.css';
import { debounce } from 'lodash';

function Chat() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const [userOnlineStatus, setUserOnlineStatus] = useState({});
    const currentUser = JSON.parse(localStorage.getItem('user'));
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
        if (!currentUser || !currentUser.userId) return;

        const sendActivity = async () => {
            try {
                const response = await fetch('http://localhost:3080/api/activity', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: currentUser.userId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to send activity');
                }
            } catch (error) {
                console.error('Error updating activity:', error);
            }
        };

        const handleActivity = debounce(sendActivity, 2000);

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('keydown', handleActivity);

        const interval = setInterval(sendActivity, 60000);

        return () => {
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            clearInterval(interval);
        };
    }, [currentUser]);

    useEffect(() => {
        const fetchUsersAndStatus = async () => {
            try {
                const response = await fetch("http://localhost:3080/api/users");
                if (response.ok) {
                    const data = await response.json();

                    // Filter out the current user
                    const filteredData = data.filter(user => user.id !== currentUser.userId);
                    setUsers(filteredData);
                    setFilteredUsers(filteredData);

                    // Fetch online status for all users
                    const status = {};
                    for (let user of filteredData) {
                        const statusResponse = await fetch(`http://localhost:3080/api/isonline/${user.id}`);
                        if (statusResponse.ok) {
                            const onlineData = await statusResponse.json();
                            status[user.id] = onlineData.isOnline;
                        }
                    }
                    setUserOnlineStatus(status);
                }
            } catch (error) {
                console.error("Error fetching users or status:", error);
            }
        };

        fetchUsersAndStatus();

        // Poll online status every 10 seconds
        const interval = setInterval(fetchUsersAndStatus, 10000);
        return () => clearInterval(interval);
    }, [currentUser.userId]);

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
        ws.current = new WebSocket('ws://localhost:3080');

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);

            if (newMessage.type === 'activity') {
                setUserOnlineStatus((prevStatus) => ({
                    ...prevStatus,
                    [newMessage.userId]: newMessage.isOnline,
                }));
            }

            if (newMessage.type === 'message') {
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
            }
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

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
        if (e.key === 'Enter') {
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
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="user"
                            onClick={() => setActiveUser(user)}
                        >
                            <img src={user.image} alt={user.email} className="user-image" />
                            <div className="user-info">
                                <span>{user.imie + ' ' + user.nazwisko}</span>
                                <span className={`status ${userOnlineStatus[user.id] ? 'online' : 'offline'}`}>
                                    {userOnlineStatus[user.id] ? 'Dostępny' : 'Niedostępny'}
                                </span>
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
                            <span className="status">{userOnlineStatus[activeUser.id] ? 'Dostępny' : 'Niedostępny'}</span>
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
                                        <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="input-area">
                            <input
                                type="text"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={handleKeyPress} // Obsługa klawisza Enter
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
