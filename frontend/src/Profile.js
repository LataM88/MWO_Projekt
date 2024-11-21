import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import "./profile.css";

function Profile() {
    const { userId } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedOpis, setEditedOpis] = useState("");
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    const loggedInUser = JSON.parse(localStorage.getItem('user'));
    const loggedInUserId = loggedInUser ? loggedInUser.userId : null;

    useEffect(() => {
        const parsedLoggedInUserId = Number(loggedInUserId);
        const parsedUserId = Number(userId);

        if (parsedLoggedInUserId === parsedUserId) {
            setIsOwnProfile(true);
        } else {
            setIsOwnProfile(false);
        }


        fetch(`http://localhost:3080/user/${userId}`)
            .then(res => res.json())
            .then(data => {
                setUser(data);
                setEditedOpis(data.opis || "");
                setLoading(false);
            })
            .catch(err => {
                console.error('Błąd pobierania danych użytkownika:', err);
                setLoading(false);
            });
    }, [userId, loggedInUserId]);

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
        if (!isEditing) {
            setEditedOpis(user.opis || "");
        }
    };

    const handleOpisChange = (e) => {
        setEditedOpis(e.target.value);
    };

    const saveOpis = () => {
        fetch(`http://localhost:3080/user/${userId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ opis: editedOpis }),
        })
            .then(res => {
                if (res.ok) {
                    setUser(prev => ({ ...prev, opis: editedOpis }));
                    setIsEditing(false);
                } else {
                    console.error("Błąd podczas zapisywania opisu.");
                }
            })
            .catch(err => {
                console.error("Błąd:", err);
            });
    };

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
                {isEditing ? (
                    <textarea
                        value={editedOpis}
                        onChange={handleOpisChange}
                        className="edit-textarea"
                    />
                ) : (
                    <p>{user.opis || "Brak opisu."}</p>
                )}
                <div className="edit-actions">
                    {isOwnProfile ? (
                        <>
                            {isEditing ? (
                                <>
                                    <button onClick={saveOpis} className="save-button">Zapisz</button>
                                    <button onClick={toggleEditMode} className="cancel-button">Anuluj</button>
                                </>
                            ) : (
                                <button onClick={toggleEditMode} className="edit-button">Edytuj opis</button>
                            )}
                        </>
                    ) : (
                        <p></p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Profile;
