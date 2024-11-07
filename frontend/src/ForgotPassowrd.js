import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./zapomnialesHasla.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [step, setStep] = useState(1);
    const navigate = useNavigate();

    const sendResetEmail = () => {
        fetch("http://localhost:3080/forgot-password", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => {
            setMessage("Kod resetu został wysłany.");
            setStep(2);
        })
        .catch(() => setMessage("Błąd wysyłania kodu resetu."));
    };

    const resetPassword = () => {
        fetch("http://localhost:3080/reset-password", {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, resetCode: code, newPassword })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Password updated successfully') {
                setMessage("Hasło zostało zmienione.");
                navigate("/login");
            } else {
                setMessage("Błąd: nieprawidłowy kod lub hasło.");
            }
        })
        .catch(() => setMessage("Wewnętrzny błąd serwera."));
    };

    return (
        <div className="forgotPasswordSite">
            <div className="forgotPasswordForm">
                <h2>Zapomniałeś hasła</h2>
                {step === 1 && (
                    <>
                        <p>Wprowadź swój adres e-mail, aby zresetować hasło.</p>
                        <input
                            type="email"
                            placeholder="Wprowadź swój e-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="emailInput"
                        />
                        <button onClick={sendResetEmail} className="submitButton">
                            Wyślij kod resetu
                        </button>
                    </>
                )}
                {step === 2 && (
                    <>
                        <input
                            type="text"
                            placeholder="Kod resetu"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="emailInput"
                        />
                        <input
                            type="password"
                            placeholder="Nowe hasło"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="emailInput"
                        />
                        <button onClick={resetPassword} className="submitButton">
                            Zresetuj hasło
                        </button>
                    </>
                )}
                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
};

export default ForgotPassword;
