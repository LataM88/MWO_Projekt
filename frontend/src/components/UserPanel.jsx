import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./userPanel.css";

const UserPanel = () => {
    const [users, setUsers] = useState([]); // All users
    const [friends, setFriends] = useState([]); // Friends list
    const [filteredUsers, setFilteredUsers] = useState([]); // Filtered users to display
    const [selectedTab, setSelectedTab] = useState("allUsers"); // Track the selected tab
    const [searchQuery, setSearchQuery] = useState(""); // Search query state
    const [dropdownUserId, setDropdownUserId] = useState(null); // Track which user has the dropdown open
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
    const handleChatClick = (userId, e) => {
        e.stopPropagation(); // Prevent dropdown from closing immediately
        navigate(`/chat/${userId}`);
    };

    // Navigate to the selected user's profile
    const handleProfileClick = (userId, e) => {
        e.stopPropagation(); // Prevent dropdown from closing immediately
        navigate(`/profile/${userId}`);
    };

    const toggleDropdown = (userId) => {
        const userElement = document.getElementById(`user-${userId}`);
        const rect = userElement.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom; // Space below the element
        const nearBottom = spaceBelow < 100; // Threshold for enough space, adjust as needed

        // Toggle the dropdown visibility
        setDropdownUserId(dropdownUserId === userId ? null : userId);

        // Apply a class to adjust the dropdown's position
        if (nearBottom) {
            userElement.classList.add("dropdown-up"); // Position above if near bottom
        } else {
            userElement.classList.remove("dropdown-up"); // Default position below
        }
    };



    // Function to get user name or email
    const getUserName = (user) => {
        return user.imie && user.nazwisko
            ? `${user.imie} ${user.nazwisko}`
            : user.email;
    };

    return (
        <div className="user-panel-block">
            <h2 className="user-panel-title">Użytkownicy</h2>
            <input
                type="text"
                className="user-panel-search-box"
                placeholder="Szukaj użytkowników..."
                value={searchQuery}
                onChange={handleSearchChange}
            />
            <div className="tabs">
                <button
                    onClick={() => setSelectedTab("allUsers")}
                    className={selectedTab === "allUsers" ? "selected" : ""}
                >
                    Wszyscy użytkownicy
                </button>
                <button
                    onClick={() => setSelectedTab("friends")}
                    className={selectedTab === "friends" ? "selected" : ""}
                >
                    Znajomi
                </button>
            </div>
            <ul className="user-panel-list">
                {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                        <li
                            key={user.id}
                            id={`user-${user.id}`}
                            className="user-panel-item"
                            onClick={() => toggleDropdown(user.id)} // Toggle dropdown on user click
                        >
                            <span
                                className={`user-panel-status ${
                                    user.status === "online" ? "online" : "offline"
                                }`}
                            />
                            <img
                                className="user-panel-avatar"
                                src={user.image}
                                alt={user.name}
                            />
                            <span className="user-panel-name" title={getUserName(user)}>
                                {getUserName(user)}
                            </span>
                            {dropdownUserId === user.id && (
                                <div className="user-options-dropdown">
                                    <button
                                        onClick={(e) => handleProfileClick(user.id, e)}
                                        className="user-options-button"
                                    >
                                        Profil
                                    </button>
                                    <button
                                        onClick={(e) => handleChatClick(user.id, e)}
                                        className="user-options-button"
                                    >
                                        Wyślij Wiadomość
                                    </button>
                                </div>
                            )}
                        </li>
                    ))
                ) : (
                    <p className="user-panel-no-users">Brak użytkowników do wyświetlenia</p>
                )}
            </ul>
        </div>
    );
};

export default UserPanel;
