import { Navigate } from 'react-router-dom';

const GuestRoute = ({ children, loggedIn }) => {
    if (loggedIn) {
        return <Navigate to="/" />;
    }
    return children;
};

export default GuestRoute;
