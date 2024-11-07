import React from "react"
import { useNavigate } from "react-router-dom";

import "./home.css";
import './css/fontello.css'

const Home = (props) => {
    const { loggedIn, email } = props
    const navigate = useNavigate();
    //props.setLoggedIn(true)
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



    /*!!!!!!!!!!!!tmp_nav!!!!!!!!!!!!!*/
    const moveToChat = () => {

        navigate("/login")
    }
    /*!!!!!!!!!!!!tmp_nav!!!!!!!!!!!!!*/


    return <div className="mainContainer" id="mainContainerHome">
        <div className={"mainBoxHome"}>
            <div className={"graphBox"}>

            </div>

            <div className={"side"}>

                <div className={"titleContainer"} id="titleHome">
                    <div>Welcome!</div>
                </div>

                <div className={"buttonContainer"}>

                    <input
                        className={"inputButtonHome"}
                        type="buttonn"
                        onClick={onButtonClick}
                        value={loggedIn ? "Log out" : "Log in"} />


                    {!loggedIn ? (

                        <input
                            className={"inputButtonHome"}
                            type="button"
                            onClick={onButtonClickReg}
                            value={"Register"}
                        />) : (
                        <div>
                            <p className={"moveToChat"} onClick={moveToChat}>You are currently logged in!</p>
                            <p className={"moveToChat"} onClick={moveToChat}>Move to chat!</p>
                        </div>)
                    }

                    <div className="icon-containerHome">
                        <i className="icon-facebook icon"></i>
                        <i className="icon-instagram icon"></i>
                        <i className="icon-twitter icon"></i>
                    </div>

                    <footer><p>obserwuj</p></footer>

                </div>
            </div>
        </div>

    </div>
}

export default Home