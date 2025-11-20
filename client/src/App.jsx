import React, { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "../context/authContext.jsx";

const App = () => {
  // to display background image on entire application as this is app component we add bg here in its div using tailwind classes ,
  // -The path is relative to your compiled CSS, so in frameworks like Vite/React, ./src/assets/... works during dev but sometimes needs to be adjusted to url('/src/assets/...') or imported in React via JS.
  // shorthand for background-image: url('./src/assets/bgImage.svg');
  // -The background image is scaled to fit entirely inside the element (it will maintain aspect ratio and not be cropped, but might not cover the entire area).
  const {authUser} = useContext(AuthContext) //checkauth function updates auth user 

  return (
    <div className="bg-[url('/bgImage8.jpg')] bg-contain">
      <Toaster/>
        <Routes>
          <Route path="/" element={authUser? <HomePage />: <Navigate to = "/login"/>} />
          <Route path="/login" element={!authUser? <LoginPage /> :  <Navigate to = "/"/>} />
          <Route path="/profile" element={authUser? <ProfilePage/> : <Navigate to = "/login"/>} /> 
        </Routes>
    
    </div>
  );
};

export default App;
