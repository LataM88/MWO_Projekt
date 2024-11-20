import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './activate.css'; // Załaduj plik CSS

const Activate = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [activationStatus, setActivationStatus] = useState(null); // Przechowuje status aktywacji
    const [message, setMessage] = useState(''); // Przechowuje wiadomość z odpowiedzi
    const [loading, setLoading] = useState(true); // Dodano stan ładowania

    useEffect(() => {
        const status = searchParams.get('status');
        const email = searchParams.get('email');

        if (!status || !email) {
            setMessage('Brak wymaganych parametrów aktywacyjnych w URL.');
            setActivationStatus('error');
            setLoading(false); // Ustawiamy loading na false
            return;
        }

        // Jeżeli status jest 'success', oznacza to pomyślną aktywację
        if (status === 'success') {
            setActivationStatus('success');
            setMessage(`Konto ${email} zostało aktywowane pomyślnie! Możesz teraz zalogować się.`);
        } else {
            setActivationStatus('error');
            setMessage('Wystąpił problem z aktywacją konta. Spróbuj ponownie.');
        }

        setLoading(false); // Ustawiamy loading na false po zakończeniu przetwarzania
    }, [searchParams]);

    // Wyświetlenie różnych komunikatów w zależności od statusu
    return (
        <div className="activation-container">
            {loading && <p className="loading-text">Aktywacja konta w toku...</p>}
            {activationStatus === 'success' && (
                <>
                    <h1 className="success-message">{message}</h1>
                    <p>Konto zostało aktywowane. Kliknij poniżej, aby przejść do logowania.</p>
                    <button
                        className="login-button"
                        onClick={() => navigate('/login')} // Przekierowanie na stronę logowania
                    >
                        Przejdź do logowania
                    </button>
                </>
            )}
            {activationStatus === 'error' && (
                <>
                    <h1 className="error-message">{message}</h1>
                    <p className="error-details">Proszę sprawdzić link aktywacyjny lub skontaktować się z obsługą.</p>
                </>
            )}
        </div>
    );
};

export default Activate;
