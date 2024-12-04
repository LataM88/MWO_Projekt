import React, { useState, useEffect } from 'react';
import './PostBoard.css';

const PostBoard = () => {
    const [posts, setPosts] = useState([]);
    const [content, setContent] = useState('');
    const [userEmail, setUserEmail] = useState('user@example.com');
    const [userIcon, setUserIcon] = useState('default-avatar.jpg');
    const [userId, setUserId] = useState(1);

    const API_URL = 'http://localhost:3080/api/posts'; // Ustaw odpowiedni adres API

    // Pobieranie danych użytkownika (możesz zaimplementować to na podstawie logowania)
    const fetchUserData = () => {
        setUserEmail('user@example.com');
        setUserIcon('default-avatar.jpg');
        setUserId(1); // Zastąp rzeczywistym ID użytkownika
    };

    const handlePostSubmit = async (event) => {
        event.preventDefault();

        if (!content) {
            alert('Musisz wpisać treść posta!');
            return;
        }

        const newPost = {
            users_id: userId, // Identyfikator użytkownika
            content,
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
                console.error('Błąd zapisu:', errorData); // Zapisujemy szczegóły błędu w konsoli
                alert(`Błąd zapisu: ${errorData.error}`);
                return;
            }

            const savedPost = await response.json();
            console.log('Zapisany post:', savedPost); // Logujemy zapisany post w konsoli

            setPosts([
                {
                    ...savedPost[0], // Oczekujemy, że zapisany post będzie dostępny w odpowiedzi
                    email: userEmail,
                    icon: userIcon,
                },
                ...posts,
            ]);

            setContent(''); // Resetujemy treść posta
        } catch (error) {
            console.error('Błąd wysyłania żądania:', error);
            alert('Nie udało się zapisać posta.');
        }
    };

    const fetchPosts = async () => {
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                const data = await response.json();
                setPosts(data.map(post => ({
                    ...post,
                    email: userEmail,
                    icon: userIcon,
                })));
            } else {
                console.error('Błąd pobierania postów:', response.statusText);
            }
        } catch (error) {
            console.error('Błąd podczas pobierania postów:', error);
        }
    };

    useEffect(() => {
        fetchUserData();
        fetchPosts();
    }, []);

    return (
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
                        {posts.map((post) => (
                            <li key={post.id} className="postboard-post-item">
                                <div className="post-header">
                                    <img src={post.icon || 'default-avatar.jpg'} alt="Ikona użytkownika" className="user-icon" />
                                    <span className="post-user-email">{post.email}</span>
                                </div>
                                <p className="black-text2">{post.content}</p>
                                <small className="postboard-post-date">{new Date(post.created_at).toLocaleString()}</small>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default PostBoard;
