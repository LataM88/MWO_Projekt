import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function Profile() {
    const { userId } = useParams(); // Pobieranie ID użytkownika z URL
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Pobieranie danych użytkownika z serwera
        fetch(`http://localhost:3080/user/${userId}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Błąd pobierania danych użytkownika:', err);
                setLoading(false);
            });
    }, [userId]);

    if (loading) return <p>Ładowanie...</p>;
    if (!user) return <p>Nie znaleziono użytkownika.</p>;

    return (
        <div>
            <h1>Profil Użytkownika</h1>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Aktywny:</strong> {user.isActive ? 'Tak' : 'Nie'}</p>
            {/* Dodaj więcej szczegółów, jeśli są dostępne */}
        </div>
    );
}

export default Profile;