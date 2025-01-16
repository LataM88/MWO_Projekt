import React, { useState, useEffect } from 'react';
import './Invitations.css';

const Invitations = ({ userId }) => {
  const [tab, setTab] = useState('sent');
  const [sentInvitations, setSentInvitations] = useState([]);
  const [receivedInvitations, setReceivedInvitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const storedData = localStorage.getItem('user');
  const userData = storedData ? JSON.parse(storedData) : null;

  // Fetch Sent Invitations
  const fetchSentInvitations = async (senderId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:3080/api/invitations/sent/${senderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userData?.token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch sent invitations');

      setSentInvitations(data);
    } catch (error) {
      setError(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Received Invitations
  const fetchReceivedInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `http://localhost:3080/api/invitations/received?receiver_id=${userData?.userId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${userData?.token}`,
          },
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch received invitations');

      setReceivedInvitations(data);
    } catch (error) {
      setError(error.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'sent' && userData?.userId) {
      fetchSentInvitations(userData.userId);
    } else if (tab === 'received' && userData?.userId) {
      fetchReceivedInvitations();
    }
  }, [tab, userData?.userId]);

  // Handle Accept Invitation
  const handleAccept = async (senderId) => {
    try {
      const response = await fetch('http://localhost:3080/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userData?.token}`,
        },
        body: JSON.stringify({ sender_id: senderId, receiver_id: userData.userId }),
      });

      if (!response.ok) throw new Error('Failed to accept invitation');
      fetchReceivedInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  // Handle Delete Invitation
  const handleDelete = async (senderId, receiverId) => {
      try {
        const response = await fetch(
          `http://localhost:3080/api/invitations/del/${senderId}/${receiverId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${userData?.token}`,
            }
          }
        );

        // Check if the response is successful
        if (!response.ok) {
          const errorMessage = await response.json();  // Get the error message from the server response
          throw new Error(errorMessage.message || 'Failed to delete invitation');
        }

        // If the deletion was successful, update the UI accordingly
        tab === 'received' ? fetchReceivedInvitations() : fetchSentInvitations(userData.userId);
      } catch (error) {
        // Log any error that occurred during the delete process
        console.error('Error deleting invitation:', error);
      }
  };



  return (
    <div className="invitations-container">
      <h1>Invitations</h1>

      {/* Tabs */}
      <div className="invitations-tabs">
        <button
          onClick={() => setTab('sent')}
          className={`invitations-tab-button ${tab === 'sent' ? 'invitations-tab-button-active' : ''}`}
        >
          Sent Invitations
        </button>
        <button
          onClick={() => setTab('received')}
          className={`invitations-tab-button ${tab === 'received' ? 'invitations-tab-button-active' : ''}`}
        >
          Received Invitations
        </button>
      </div>

      {/* Loading and Error */}
      {loading && <p>Loading...</p>}
      {error && <p className="invitations-error-message">{error}</p>}

      {/* Invitations List */}
      {!loading && !error && (
        <ul className="invitations-list">
          {(tab === 'received' ? receivedInvitations : sentInvitations).map((invitation) => (
            <li key={invitation.users.id} className="invitations-list-item">
              <p>
                <strong>{invitation.users.imie} {invitation.users.nazwisko}</strong>
              </p>
              <img
                src={invitation.users.image}
                alt={`${invitation.users.imie} ${invitation.users.nazwisko}`}
                className="invitations-list-item-image"
              />
              {tab === 'received' ? (
                <>
                  <button onClick={() => handleAccept(invitation.users.id)}>Przyjmij</button>
                  <button onClick={() => handleDelete(invitation.users.id, userData.userId)}>Odrzuć</button>
                </>
              ) : (
                <button onClick={() => handleDelete(userData.userId, invitation.users.id)}>Anuluj</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Invitations;
