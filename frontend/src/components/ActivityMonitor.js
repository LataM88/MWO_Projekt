import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { debounce } from 'lodash';

const ActivityMonitor = () => {
    const { userId } = useParams();
    const [userIdState, setUserIdState] = useState(null);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser && storedUser.userId) {
            setUserIdState(storedUser.userId);
        }
    }, [userId]);

   useEffect(() => {
       if (!userIdState) return;

       const sendActivity = async () => {
           try {
               const response = await fetch('http://localhost:3080/api/activity', {
                   method: 'POST',
                   headers: {
                       'Content-Type': 'application/json',
                   },
                   body: JSON.stringify({ userId: userIdState }),
               });

               if (!response.ok) {
                   throw new Error('Błąd podczas aktualizacji aktywności');
               }
           } catch (error) {
               console.error('Błąd podczas aktualizacji aktywności:', error);
               // Retry the request a few times before giving up
               setTimeout(sendActivity, 3000); // Retry after 3 seconds
           }
       };

       const handleActivity = debounce(sendActivity, 2000); // Throttle the activity handling

       window.addEventListener('mousemove', handleActivity);
       window.addEventListener('keydown', handleActivity);

       const interval = setInterval(sendActivity, 6000); // Send activity every 60 seconds

       return () => {
           window.removeEventListener('mousemove', handleActivity);
           window.removeEventListener('keydown', handleActivity);
           clearInterval(interval);
       };
   }, [userIdState]);

    return null;
};

export default ActivityMonitor;
