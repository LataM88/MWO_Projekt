import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import "./profile.css"

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
        <div className="mainprofile">
            <div className="profile-header">
                <img
                    src={user.photo || "https://placehold.jp/005f63/ffffff/120x120.png"}
                    alt="Zdjęcie profilowe"
                    className="profile-image"
                />
                <div className="profile-actions">
                    <span className={`status ${user.isActive ? "" : "inactive"}`}>
                        {user.isActive ? "Aktywny" : "Nie aktywny"}
                    </span>
                    <button className="inputButtonProfile">Wyślij wiadomość</button>
                </div>
            </div>

            <div className="profile-content">
                <p className="email">{user.email}</p>
                <p>{user.id}</p>
                <div className="email-line"></div>
                <p className="title">O mnie:</p>
                <p>{user.opis || "Brak opisu."}</p>
            </div>
        </div>
    );
}

export default Profile;