import React, { useState, useEffect } from 'react';
import './PostBoard.css';
import UserPanel from "./components/UserPanel.jsx";

const PostBoard = () => {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userIcon, setUserIcon] = useState('default-avatar.jpg');
    const [userId, setUserId] = useState(null); // Identyfikator użytkownika

    const API_URL = 'http://localhost:3080/api/posts'; // Adres API do pobierania i dodawania postów

    // Pobiera dane użytkownika z localStorage
    const fetchUserData = () => {
        const userData = localStorage.getItem('user'); // Klucz "user" zawiera dane użytkownika

        if (userData) {
            try {
                const parsedUserData = JSON.parse(userData);

                // Założenie: obiekt zawiera email, userId i userIcon
                setUserEmail(parsedUserData.email || 'default@example.com');
                setUserId(parsedUserData.userId || 1);
                setUserIcon(parsedUserData.userIcon || 'default-avatar.jpg');
            } catch (error) {
                console.error('Błąd parsowania danych użytkownika z localStorage:', error);
            }
        } else {
            console.log('Brak danych użytkownika w localStorage');
        }
    };

    // Obsługuje wysyłanie nowego posta
    const handlePostSubmit = async (event) => {
        event.preventDefault();

        if (!content) {
            alert('Musisz wpisać treść posta!');
            return;
        }

        const newPost = {
            users_id: userId, // Identyfikator użytkownika
            content,          // Treść posta
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPost),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Błąd zapisu: ${errorData.error}`);
                return;
            }

            // Po zapisaniu posta, odśwież listę postów
            await fetchPosts();

            setContent(''); // Resetowanie pola tekstowego
        } catch (error) {
            console.error('Błąd wysyłania żądania:', error);
            alert('Nie udało się zapisać posta.');
        }
    };


    // Pobiera wszystkie posty z API
    const fetchPosts = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                console.log("Otrzymane dane postów:", data); // Sprawdź dane w konsoli

                setPosts(data); // Zapisz dane postów w stanie
            } else {
                console.error('Błąd pobierania postów:', response.statusText);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania postów:', error);
        }
    };



    useEffect(() => {
        fetchUserData(); // Pobiera dane użytkownika
        fetchPosts();    // Pobiera posty z API
    }, []); // Wykonuje się raz przy renderowaniu komponentu

    return (
        <div className="main-container">
            <div className="userpanel-container"><UserPanel/></div>
            <div className="postboard-container-unique">
                <h1>Tablica Postów</h1>

                {/* Formularz do dodawania posta */}
                <form className="postboard-form" onSubmit={handlePostSubmit}>
                    <textarea
                        className="postboard-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Co słychać?"
                    ></textarea>
                    <button className="postboard-button" type="submit">Dodaj post</button>
                </form>

                {/* Wyświetlanie listy postów */}
                <div>
                    <h2>Wszystkie posty:</h2>
                    {posts.length === 0 ? (
                        <p className="black-text3">Brak postów na tablicy!</p>
                    ) : (
                        <ul className="postboard-posts-list">
                            {posts.map((post, index) => (
                                <li key={post.id || index} className="postboard-post-item">
                                    <div className="post-header">
                                        <img
                                            src={post.user?.image || 'default-avatar.jpg'}
                                            alt="Ikona użytkownika"
                                            className="user-icon"
                                        />
                                        <div className="user-info">
                        <span className="post-user-name">
                            {post.user?.imie || 'Nieznane imię'} {post.user?.nazwisko || 'Nieznane nazwisko'}
                        </span>
                                            <span
                                                className="post-user-email">({post.user?.email || 'Nieznany email'})</span>
                                        </div>
                                    </div>
                                    <p className="black-text2">{post.content}</p>
                                    <small className="postboard-post-date">
                                        {new Date(post.created_at).toLocaleString()}
                                    </small>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostBoard;
