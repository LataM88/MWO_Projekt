import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

import "./Login.css";
import './css/fontello.css';

const Login = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const navigate = useNavigate();

    const onButtonClick = () => {
        setEmailError("");
        setPasswordError("");

        // Weryfikacja e-mail
        if (email === "") {
            setEmailError("Proszę wprowadź email");
            return;
        }

        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            setEmailError("Wprowadź poprawny email");
            return;
        }

        // Weryfikacja hasła
        if (password === "") {
            setPasswordError("Wprowadź hasło");
            return;
        }

        if (password.length < 8) {
            setPasswordError("Hasło musi mieć 8 znaków lub więcej");
            return;
        }

        checkAccountExists(accountExists => {
            if (accountExists) {
                logIn();
            } else {
                if (window.confirm("Konto z podanym adresem email nie istnieje. Chcesz założyć nowe konto?")) {
                    navigate("/register");
                }
            }
        });
    };

    const checkAccountExists = (callback) => {
        fetch("http://localhost:3080/check-account", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        })
        .then(response => response.json())
        .then(data => callback(data?.userExists))
        .catch(error => {
            console.error('Błąd podczas sprawdzania istnienia konta:', error);
            callback(false);
        });
    };

    const logIn = () => {
        fetch("http://localhost:3080/auth", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'success') {
                localStorage.setItem("user", JSON.stringify({
                    email,
                    token: data.token,
                    userId: data.userId // Zapisujemy userId
                }));
                props.setLoggedIn(true);
                props.setEmail(email);
                navigate("/");
            } else if (data.message === 'Konto nie zostało aktywowane. Sprawdź swój e-mail, aby je aktywować.') {
                window.alert('Konto nie zostało aktywowane. Sprawdź swój e-mail, aby je aktywować.');
            } else {
                window.alert("Błędny email lub hasło!");
            }
        })
        .catch(error => {
            console.error('Błąd logowania:', error);
        });
    };

    return (
        <div className="mainContainerLogin">
            <div className="OptionContainerLogin">
                <div className="titleContainerLogin">
                    <div>Logowanie</div>
                </div>
                <div className="welcomeContainerLogin">
                    <div>Cześć, <br />Witamy!</div>
                </div>
                <br />
                <div className="inputContainerLogin">
                    <input
                        value={email}
                        placeholder="Wprowadź swój E-mail."
                        onChange={ev => setEmail(ev.target.value)}
                        className="inputBoxLogin"
                    />
                    <label className="errorLabelLogin">{emailError}</label>
                </div>
                <br />
                <div className="inputContainerLogin">
                    <input
                        type="password"
                        value={password}
                        placeholder="Wprowadź swoje hasło."
                        onChange={ev => setPassword(ev.target.value)}
                        className="inputBoxLogin"
                    />
                    <label className="errorLabelLogin">{passwordError}</label>
                    <br />
                    <div className="inputContainerLogin">
                        <label>
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                            />
                            Zapamiętaj mnie
                        </label>
                    </div>
                </div>
                <br />
                <div className="inputContainerLogin">
                    <input
                        className="inputButtonLogin1"
                        type="button"
                        onClick={onButtonClick}
                        value="Zaloguj"
                    />
                </div>
                <br />
                <div className="inputContainerLogin">
                    <p>
                        Nie posiadasz jeszcze konta? <Link to="/register">Zarejestruj się!</Link>
                    </p>
                </div>
                <div className="inputContainerLogin">
                    <div className="forgotPasswordContainer">
                        <p className="forgotPasswordLink">
                            <Link to="/zapomnialesHasla">Zapomniałeś hasła?</Link>
                        </p>
                    </div>
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

export default Login;