import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./userPanel.css";

const UserPanel = () => {
    const [users, setUsers] = useState([]); // All users
    const [friends, setFriends] = useState([]); // Friends list
    const [filteredUsers, setFilteredUsers] = useState([]); // Filtered users to display
    const [selectedTab, setSelectedTab] = useState("allUsers"); // Track the selected tab
    const [searchQuery, setSearchQuery] = useState(""); // Search query state
    const navigate = useNavigate();

    const storedData = localStorage.getItem("user");
    const userData = storedData ? JSON.parse(storedData) : null;
    const loggedInUserEmail = userData ? userData.email : null;

    // Fetch users and friends when component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch("http://localhost:3080/api/users");
                if (response.ok) {
                    const data = await response.json();
                    const filteredUsers = data.filter(
                        (user) => user.email !== loggedInUserEmail
                    );
                    setUsers(filteredUsers);
                    setFilteredUsers(filteredUsers); // Initially set all users
                } else {
                    console.error("Failed to fetch users:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        const fetchFriends = async () => {
            try {
                const response = await fetch("http://localhost:3080/api/friends");
                if (response.ok) {
                    const data = await response.json();
                    setFriends(data);
                } else {
                    console.error("Failed to fetch friends:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching friends:", error);
            }
        };

        fetchUsers();
        fetchFriends();
    }, [loggedInUserEmail]);

    // Update filtered users based on tab selection
    useEffect(() => {
        if (selectedTab === "allUsers") {
            setFilteredUsers(users);
        } else {
            setFilteredUsers(friends);
        }
    }, [selectedTab, users, friends]);

    // Function to handle search query changes
    const handleSearchChange = (e) => {
        const query = e.target.value.toLowerCase();
        setSearchQuery(query);

        // Filter based on the selected tab and search query
        if (selectedTab === "allUsers") {
            const filtered = users.filter((user) =>
                user.email.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        } else {
            const filtered = friends.filter((user) =>
                user.email.toLowerCase().includes(query)
            );
            setFilteredUsers(filtered);
        }
    };

    // Navigate to chat with the selected user
    const handleChatClick = (userId) => {
        navigate(`/chat/${userId}`);
    };

    // Navigate to the selected user's profile
    const handleProfileClick = (userId) => {
        navigate(`/profile/${userId}`);
    };

    // Toggle tab selection
    const toggleTab = (tab) => {
        setSelectedTab(tab);
    };

    // Function to get user name or email
    const getUserName = (user) => {
        return user.imie && user.nazwisko
            ? `${user.imie} ${user.nazwisko}`
            : user.email;
    };

    return (
        <div className="user-panel-block">
            <h2 className="user-panel-title">Lista użytkowników</h2>
            <input
                type="text"
                className="user-panel-search-box"
                placeholder="Szukaj użytkowników..."
                value={searchQuery}
                onChange={handleSearchChange}
            />
            <div className="tabs">
                <button
                    onClick={() => toggleTab("allUsers")}
                    className={selectedTab === "allUsers" ? "selected" : ""}
                >
                    Wszyscy użytkownicy
                </button>
                <button
                    onClick={() => toggleTab("friends")}
                    className={selectedTab === "friends" ? "selected" : ""}
                >
                    Znajomi
                </button>
            </div>
            <ul className="user-panel-list">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <li key={user.id} className="user-panel-item">
                            {/* Status on the left side of the avatar */}
                            <span
                                className={`user-panel-status ${user.isActive ? "online" : "offline"}`}
                                title={user.isActive ? "Online" : "Offline"}
                            ></span>
                            <img
                                src={user.image || "default-avatar.png"}
                                alt={`Avatar of ${getUserName(user)}`}
                                className="user-panel-avatar"
                                onClick={() => handleProfileClick(user.id)} // Navigate to profile when clicking the avatar
                            />
                            <span
                                className="user-panel-name"
                                title={getUserName(user)}
                                onClick={() => handleProfileClick(user.id)} // Navigate to profile when clicking the name
                            >
                                {getUserName(user)}
                            </span>

                            {/* Button with updated text */}
                            <button
                                className="chat-button"
                                onClick={() => handleChatClick(user.id)} // Using user.id here
                            >
                                Wyślij wiadomość
                            </button>
                        </li>
                    ))
                ) : (
                    <li className="user-panel-no-users">
                        {selectedTab === "allUsers" ? "Brak użytkowników." : "Brak znajomych."}
                    </li>
                )}
            </ul>
        </div>
    );
};

export default UserPanel;
