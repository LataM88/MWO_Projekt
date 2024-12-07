import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './chat.css';

function Chat() {
    const { userId } = useParams(); // Get userId from the URL
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [activeUser, setActiveUser] = useState(null);
    const currentUser = JSON.parse(localStorage.getItem('user')); // Pobieranie zalogowanego użytkownika

    // WebSocket reference
    const ws = useRef(null);

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

    useEffect(() => {
        if (activeUser) {
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

    // Open WebSocket connection when component is mounted
    useEffect(() => {
        // Połączenie WebSocket
        ws.current = new WebSocket('ws://localhost:3080');

        ws.current.onopen = () => {
            console.log('WebSocket connected');
        };

        // Nasłuchiwanie wiadomości z WebSocket
        ws.current.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);
            console.log(newMessage);  // Sprawdź całą wiadomość
            console.log(newMessage.timestamp);  // Sprawdź tylko timestamp

            // Jeśli brak timestampu, przypisz go
            if (!newMessage.timestamp) {
                newMessage.timestamp = new Date().toISOString();  // Możesz przypisać obecny czas, jeśli brakuje
            }

            // Sprawdzenie, czy wiadomość już istnieje w stanie
            setMessages((prevMessages) => {
                // Dodajemy nową wiadomość tylko wtedy, gdy jej nie ma jeszcze w liście
                const messageExists = prevMessages.some(msg => msg.senderId === newMessage.senderId && msg.content === newMessage.content);
                if (!messageExists) {
                    return [...prevMessages, newMessage];
                }
                return prevMessages;
            });
        };


        // Cleanup WebSocket po odmontowaniu komponentu
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, []);

    // Formatowanie czasu wiadomości
    const formatTime = (timestamp) => {
         const date = new Date(timestamp); // Tworzymy obiekt Date z timestampu
         if (isNaN(date.getTime())) {
             return "";  // Jeśli timestamp jest nieprawidłowy, zwróć pusty ciąg
         }

         // Używamy getUTCHours i getUTCMinutes do uzyskania godzin i minut
         const hours = date.getHours().toString().padStart(2, '0');
         const minutes = date.getMinutes().toString().padStart(2, '0');
         return `${hours}:${minutes}`;  // Zwracamy godzinę w formacie "HH:MM"
     };


    const handleSendMessage = async () => {
        if (message && activeUser) {
            const timestamp = new Date().toISOString(); // Zapisz dokładny czas wysłania wiadomości

            const newMessage = {
                senderId: currentUser.userId,
                receiverId: activeUser.id,
                content: message,
                timestamp, // Dodajemy timestamp do wiadomości
            };

            console.log(newMessage.timestamp);  // Sprawdź timestamp przed wysłaniem

            const response = await fetch('http://localhost:3080/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newMessage),
            });

            if (response.ok) {
                // Dodaj wiadomość do stanu tylko jeśli jej tam jeszcze nie ma
                setMessages(prevMessages => {
                    if (!prevMessages.some(msg => msg.content === newMessage.content && msg.senderId === newMessage.senderId)) {
                        return [...prevMessages, newMessage];
                    }
                    return prevMessages;
                });
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
                    {(filteredUsers.length > 0 ? filteredUsers : users).map((user, index) => (
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
                            {messages.map((msg, index) => {
                            console.log(msg.timestamp);
                                // Find the user who sent the message
                                const sender = users.find(user => user.id === msg.senderId);

                                return (
                                    <div key={index} className={`message ${msg.senderId === currentUser.userId ? 'sent' : 'received'}`}>
                                        {sender && (
                                            <div className="message-sender">
                                                <span className="sender-name">{sender.imie} {sender.nazwisko}</span>
                                            </div>
                                        )}
                                        <div className="message-text">
                                            {msg.content}
                                        </div>
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