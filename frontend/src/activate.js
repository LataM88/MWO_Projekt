import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Activate = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`http://localhost:3080/activate/${token}`)
            .then(response => response.text())
            .then(message => {
                alert(message);
                navigate('/login');
            })
            .catch(error => {
                alert('Błąd podczas aktywacji konta.');
            });
    }, [token, navigate]);

    return <div>Aktywowanie konta...</div>;
};

export default Activate;
