import React, { useContext } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSideBar";
import { ChatContext } from "../../context/ChatContext.jsx";
const HomePage = () => {
  const {selectedUser} = useContext(ChatContext);
  return (
    <div
      className="border w-full h-screen sm:px-[15%] sm:py-[5%]" /*adding height for the file,React uses className to apply CSS classes.
    border: 1px solid rgb(229, 231, 235);
    Tailwind’s default border-gray-200 width: 100%; height: 100vh; 
    (sm)On tablet or bigger (≥640px) → 15% horizontal padding, 5% vertical padding, for different screen sizes we add padding*/
    >
      <div
        className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full grid grid-cols-1 relative ${
          selectedUser
            ? "md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
            : "md:grid-cols-2"
        }`} /* if a user is selected show 3 cols, if not then only 2 */
      >
        <SideBar/>
        <ChatContainer />
        <RightSideBar  />
      </div>
    </div>
  );
};

export default HomePage;
