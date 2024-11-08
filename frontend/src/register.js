import React, { useState } from "react";
import {Link, useNavigate} from "react-router-dom";

import "./Register.css";
import './css/fontello.css'

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
            body: JSON.stringify({ email, password }) // Usunięcie aktywacji
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === "success") {
                alert("Rejestracja zakończona sukcesem!");
                navigate("/login"); // Przekierowanie do logowania
            } else {
                alert("Wystąpił błąd: " + data.message);
            }
        });
    };

    return (
        <div className="mainContainerRegister">
            <div className={"OptionContainerRegister"}>
                <div className="titleContainerRegister">
                    <div>Rejestracja</div>
                </div>
                <div className={"welcomeContainerRegister"}>
                    <div>Cześć, <br/>Witamy po raz pierwszy!</div>
                </div>
                <br/>
                <div className="inputContainerRegister">
                    <input
                        value={email}
                        placeholder="Wprowadź swój email"
                        onChange={ev => setEmail(ev.target.value)}
                        className="inputBoxRegister"
                    />
                    <label className="errorLabelRejestracja">{emailError}</label>
                </div>
                <br/>
                <div className="inputContainerRegister">
                    <input
                        type="password"
                        value={password}
                        placeholder="Wprowadź swoje hasło"
                        onChange={ev => setPassword(ev.target.value)}
                        className="inputBoxRegister"
                    />
                    <label className="errorLabelRejestracja">{passwordError}</label>
                </div>
                <br/>
                <div className="inputContainerRegister">
                    <input
                        className="inputButtonRegister"
                        type="button"
                        onClick={onButtonClick}
                        value="Zarejestruj się"
                    />
                </div>
                <div className={"inputContainerRegister"}>
                    <p>
                        Posiadasz już konto? <Link to="/login">Zaloguj się!</Link> {/* Link do rejestracji */}
                    </p>
                </div>
                <div className="icon-container">
                    <i className="icon-facebook icon"></i>
                    <i className="icon-instagram icon"></i>
                    <i className="icon-twitter icon"></i>
                </div>
                <footer><p>obserwuj</p></footer>
            </div>
        </div>
    );
};

export default Register;
