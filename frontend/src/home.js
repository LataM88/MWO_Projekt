import React from "react"
import { useNavigate } from "react-router-dom";
import myImage from './img/homechat.png';

import "./home.css";
import './css/fontello.css'

const Home = (props) => {
    const { loggedIn, email } = props
    const navigate = useNavigate();
    const onButtonClick = () => {
        if (loggedIn) {
            localStorage.removeItem("user")
            props.setLoggedIn(false)
        } else {
            navigate("/login")
        }
    }
    const onButtonClickReg = () => {

        navigate("/register")
    }





    return <div className="mainContainer" id="mainContainerHome">
        <div className={"mainBoxHome"}>
            <div className={"graphBox"}>
                <img src={myImage} alt="" />
            </div>

            <div className={"side"}>

                <div className={"titleContainer"} id="titleHome">
                    <div>Witamy!</div>
                </div>

                <div className={"buttonContainer"}>

                    <input
                        className={"inputButtonHome"}
                        type="button"
                        onClick={onButtonClick}
                        value={loggedIn ? "Wyloguj" : "Zaloguj"} />


                    {!loggedIn ? (

                        <input
                            className={"inputButtonHome"}
                            type="button"
                            onClick={onButtonClickReg}
                            value={"Zarejestruj się"}
                        />) : (
                        <div>
                            <p>Jesteś zalogowany jako {email}!</p>
                        </div>)
                    }

                    <div className="icon-containerHome">
                        <i className="icon-facebook icon"></i>
                        <i className="icon-instagram icon"></i>
                        <i className="icon-twitter icon"></i>
                    </div>

                    <p>obserwuj</p>

                </div>
            </div>
        </div>

    </div>
}

export default Home