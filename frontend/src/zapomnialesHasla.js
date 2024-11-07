import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./zapomnialesHasla.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const onSubmit = () => {
        setEmailError("");
        setMessage("");

        if (email === "") {
            setEmailError("Proszę wprowadzić adres e-mail.");
            return;
        }

        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            setEmailError("Proszę wprowadzić poprawny adres e-mail.");
            return;
        }

    };

    return (
        <div className="forgotPasswordSite">
            <div className="forgotPasswordForm">
                <h2>Zapomniałeś hasła</h2>
                <p>Wprowadź swój adres e-mail, aby zresetować hasło.</p>
                <input
                    type="email"
                    placeholder="Wprowadź swój e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="emailInput"
                />
                <div className="errorMessage">{emailError}</div>
                <button onClick={onSubmit} className="submitButton">
                    Zresetuj hasło
                </button>
                {message && <p className="message">{message}</p>}
                <div className="backToLogin">
                    <p onClick={() => navigate("/login")} className="backLink">
                        Wróć do logowania
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
