import React, { useState, useEffect, useRef } from 'react';
import chatImage from '.././img/chat-round-dots-svgrepo-com.png';
import './userPanel.css';

const UserPanel = ({ onUserClick }) => {
    const [users, setUsers] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const buttonRef = useRef(null);

    // Retrieve the logged-in user's email from localStorage
    const storedData = localStorage.getItem('user'); // Retrieve the object from localStorage
    const userData = storedData ? JSON.parse(storedData) : null;
    const loggedInUserEmail = userData ? userData.email : null; // Extract email from the parsed object

    // Fetch users from the server when the component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('http://localhost:3080/api/users');
                if (response.ok) {
                    const data = await response.json();
                    // Filter out the logged-in user based on email
                    const filteredUsers = data.filter(user => user.email !== loggedInUserEmail);
                    setUsers(filteredUsers);  // Set the state with the filtered users
                } else {
                    console.error("Failed to fetch users:", response.statusText);
                }
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();  // Call the function to fetch users
    }, [loggedInUserEmail]); // Re-run effect if email changes

    // Toggle visibility of the user panel
    const togglePanel = () => {
        setIsVisible(!isVisible);
    };

    return (
        <div className="user-panel-container">
            <button className="user-panel-button" onClick={togglePanel} ref={buttonRef}>
               <img src={chatImage} />
            </button>

            {/* User Panel with smooth fade-in effect */}
            <div className={`user-panel ${isVisible ? 'show' : 'hide'}`} style={{ top: `${buttonRef.current?.offsetTop + buttonRef.current?.offsetHeight}px` }}>
                <ul className="user-list">
                    {users.length === 0 ? (
                        <li className="no-users">No users found.</li>  // Handle empty state
                    ) : (
                        users.map((user) => (
                            <li key={user.email} onClick={() => onUserClick(user.email)}>
                                {user.email}  {/* Display the user's email */}
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default UserPanel;
