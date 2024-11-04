import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const navigate = useNavigate();

    const onButtonClick = () => {
        setEmailError("");
        setPasswordError("");

        // Walidacja danych wejściowych
        if ("" === email) {
            setEmailError("Proszę wprowadzić swój email");
            return;
        }

        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            setEmailError("Proszę wprowadzić prawidłowy email");
            return;
        }

        if ("" === password) {
            setPasswordError("Proszę wprowadzić hasło");
            return;
        }

        if (password.length < 8) {
            setPasswordError("Hasło musi mieć co najmniej 8 znaków");
            return;
        }

        // Wywołanie API rejestracji
        fetch("http://localhost:3080/register", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "success") {
                alert("Rejestracja zakończona sukcesem! Sprawdź swoją skrzynkę pocztową, aby aktywować konto.");
                navigate("/login"); // Przekierowanie do logowania
            } else {
                alert("Wystąpił błąd: " + data.message);
            }
        });
    };

    return (
        <div className="mainContainer">
            <div className="titleContainer">
                <div>Rejestracja</div>
            </div>
            <br />
            <div className="inputContainer">
                <input
                    value={email}
                    placeholder="Wprowadź swój email"
                    onChange={ev => setEmail(ev.target.value)}
                    className="inputBox"
                />
                <label className="errorLabel">{emailError}</label>
            </div>
            <br />
            <div className="inputContainer">
                <input
                    type="password"
                    value={password}
                    placeholder="Wprowadź swoje hasło"
                    onChange={ev => setPassword(ev.target.value)}
                    className="inputBox"
                />
                <label className="errorLabel">{passwordError}</label>
            </div>
            <br />
            <div className="inputContainer">
                <input
                    className="inputButton"
                    type="button"
                    onClick={onButtonClick}
                    value="Zarejestruj się"
                />
            </div>
        </div>
    );
};

export default Register;
