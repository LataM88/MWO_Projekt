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
    const navigate = useNavigate();

    const onButtonClick = () => {
        setEmailError("");
        setPasswordError("");

        if (email === "") {

            setEmailError("Prosze wprowadź email");

            setEmailError("Podaj swój email");

            return;
        }

        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {

            setEmailError("Wprowadź poprawny eamil");

            setEmailError("Podaj poprawny email");

            return;
        }

        if (password === "") {
            setPasswordError("Wprowadź hasło");
            return;
        }

        if (password.length < 8) {

            setPasswordError("Hasło musi mieć 8 znaków lub więcej");

            setPasswordError("Hasło musi mieć 8 znaków lub wiecej");

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
        .then(data => {
            callback(data?.userExists);
        })
        .catch(error => {
            console.error('Error checking account existence:', error);
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
                localStorage.setItem("user", JSON.stringify({ email, token: data.token }));
                props.setLoggedIn(true);
                props.setEmail(email);
                navigate("/");
            } else {
                window.alert("Błedny email lub hasło!");
            }
        })
        .catch(error => {
            console.error('Error logging in:', error);
        });
    };

    const [rememberMe, setRememberMe] = useState(false);

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
                        placeholder="Wprowadz swój E-mail."
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
                        placeholder="Wprowadz swoje hasło."
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