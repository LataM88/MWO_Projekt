import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

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
            setEmailError("Please enter your email");
            return;
        }

        if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
            setEmailError("Please enter a valid email");
            return;
        }

        if (password === "") {
            setPasswordError("Please enter a password");
            return;
        }

        if (password.length < 8) {
            setPasswordError("The password must be 8 characters or longer");
            return;
        }

        checkAccountExists(accountExists => {
            if (accountExists) {
                logIn();
            } else {
                if (window.confirm("An account does not exist with this email address. Do you want to create a new account?")) {
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
                window.alert("Wrong email or password");
            }
        })
        .catch(error => {
            console.error('Error logging in:', error);
        });
    };

    return (
        <div className="mainContainer">
            <div className="titleContainer">
                <div>Login</div>
            </div>
            <br />
            <div className="inputContainer">
                <input
                    value={email}
                    placeholder="Enter your email here"
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
                    placeholder="Enter your password here"
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
                    value="Log in"
                />
            </div>
            <br />
            <div className="inputContainer">
                <p>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
