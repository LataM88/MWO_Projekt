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
    const [verificationCode, setVerificationCode] = useState(""); // Add state for the 2FA code
    const [verificationCodeError, setVerificationCodeError] = useState(""); // Add error state for the code
    const [isTwoFactorRequired, setIsTwoFactorRequired] = useState(false); // Track if 2FA is required
    const navigate = useNavigate();

    const onButtonClick = () => {
        setEmailError("");
        setPasswordError("");
        setVerificationCodeError(""); // Reset verification error

        if (email === "") {
            setEmailError("Proszę wprowadź email");
            return;
        }

        if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            setEmailError("Podaj poprawny email");
            return;
        }

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
        .then(data => {
            callback(data?.userExists);
        })
        .catch(error => {
            console.error('Error checking account existence:', error);
            callback(false);
        });
    };

    const logIn = () => {
        console.log("Wysyłanie żądania logowania:", { email, password });
        fetch("http://localhost:3080/auth", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
            .then(response => response.json())
            .then(data => {
                console.log("Odpowiedź serwera:", data); // Zaloguj odpowiedź serwera

                if (data.message === 'success') {
                    // Zapisujemy dane użytkownika w localStorage
                    const userData = {
                        email,
                        userId: data.userId // Zapisujemy userId
                    };

                    console.log("Zapisanie danych do localStorage:", userData); // Zaloguj dane przed zapisaniem
                    localStorage.setItem("user", JSON.stringify(userData));

                    // After successful login, trigger 2FA step if necessary
                    setIsTwoFactorRequired(true);
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


    const verifyTwoFactorCode = () => {
        setVerificationCodeError("");

        if (verificationCode === "") {
            setVerificationCodeError("Proszę wprowadź kod weryfikacyjny");
            return;
        }

        // Call the verify-2fa endpoint
        fetch("http://localhost:3080/verify-2fa", {
            method: "POST",
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: JSON.parse(localStorage.getItem("user")).userId,
                twoFactorCode: verificationCode
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message === 'Weryfikacja pomyślna') {
                const existingUser = JSON.parse(localStorage.getItem("user")) || {};
                const updatedUser = {
                    ...existingUser,
                    token: data.token,
                };
                localStorage.setItem("user", JSON.stringify(updatedUser));

                props.setLoggedIn(true);
                navigate("/"); // Redirect to homepage or desired page
            } else {
                setVerificationCodeError("Nieprawidłowy kod weryfikacyjny.");
            }
        })
        .catch(error => {
            console.error('Błąd weryfikacji 2FA:', error);
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

                {/* 2FA Step */}
                {isTwoFactorRequired && (
                    <div>
                        <div className="inputContainerLogin">
                            <input
                                value={verificationCode}
                                placeholder="Wprowadź kod weryfikacyjny"
                                onChange={ev => setVerificationCode(ev.target.value)}
                                className="inputBoxLogin"
                            />
                            <label className="errorLabelLogin">{verificationCodeError}</label>
                        </div>
                        <div className="inputContainerLogin">
                            <input
                                className="inputButtonLogin1"
                                type="button"
                                onClick={verifyTwoFactorCode}
                                value="Zweryfikuj kod"
                            />
                        </div>
                    </div>
                )}
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
