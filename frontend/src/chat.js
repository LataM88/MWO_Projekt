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
    const [userOnlineStatus, setUserOnlineStatus] = useState({});
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const ws = useRef(null);
    const messagesEndRef = useRef(null); // Ref to the end of the messages

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        const fetchUsersAndStatus = async () => {
            try {
                const response = await fetch("http://localhost:3080/api/users");
                if (response.ok) {
                    const data = await response.json();
                    const filteredData = data.filter(user => user.id !== currentUser.userId);
                    setUsers(filteredData);
                    setFilteredUsers(filteredData);

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
                        const transformedMessages = data.messages.map(msg => ({
                            ...msg,
                            senderId: msg.sender_id,
                            receiverId: msg.receiver_id,
                            timestamp: msg.timestamp,
                        }));
                        setMessages(transformedMessages);
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
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                    ws.current.send(JSON.stringify(newMessage)); // Send via WebSocket
                    setMessage('');
                    scrollToBottom();
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

    // Make sure users are loaded before rendering the chat messages
    const isUsersLoaded = users.length > 0;

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
                            <div className="status-dot">
                                <span className={`dot ${userOnlineStatus[user.id] ? 'online-dot' : 'offline-dot'}`}></span>
                            </div>
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
                            {isUsersLoaded ? (
                                messages.map((msg, index) => {
                                    const sender = users.find(user => user.id === msg.senderId);
                                    // If sender is not found and the message was sent by the current user
                                    const isSentByCurrentUser = msg.senderId === currentUser.userId;

                                    return (
                                        <div key={index} className={`message ${isSentByCurrentUser ? 'sent' : 'received'}`}>
                                            {isSentByCurrentUser || sender ? (
                                                <div className="message-sender">
                                                    <span className="sender-name">
                                                        {isSentByCurrentUser
                                                            ? currentUser.imie + ' ' + currentUser.nazwisko
                                                            : sender?.imie + ' ' + sender?.nazwisko || 'Unknown sender'}
                                                    </span>
                                                </div>
                                            ) : null}
                                            <div className="message-text">{msg.content}</div>
                                            <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    );
                                })
                            ) : (
                                <p>Loading users...</p>
                            )}
                            <div ref={messagesEndRef}></div> {/* Element for scrolling */}
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

