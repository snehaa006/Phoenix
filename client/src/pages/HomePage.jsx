import React, { useCallback, useContext, useEffect, useState } from "react";
import SideBar from "../components/SideBar";
import ChatContainer from "../components/ChatContainer";
import RightSideBar from "../components/RightSideBar";
import Lightbox from "../components/Lightbox";
import { ChatContext } from "../../context/ChatContext.jsx";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);
  //contact panel starts open on wide screens, closed elsewhere
  const [showInfo, setShowInfo] = useState(() => window.matchMedia("(min-width: 1280px)").matches);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const closeLightbox = useCallback(() => setLightboxSrc(null), []);

  //on small screens always start a chat on the conversation, not the info panel
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) setShowInfo(false);
  }, [selectedUser]);

  const infoVisible = Boolean(selectedUser && showInfo);

  return (
    <div className="h-dvh w-full md:p-6 lg:px-[6%] lg:py-8">
      <div className={`panel relative grid h-full grid-cols-1 overflow-hidden md:rounded-3xl ${
        infoVisible ? "md:grid-cols-[300px_1fr] lg:grid-cols-[320px_1fr_300px]" : "md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]"
      }`}>
        <SideBar />
        <ChatContainer showInfo={infoVisible} onToggleInfo={() => setShowInfo((s) => !s)} onOpenImage={setLightboxSrc} />
        {infoVisible && (
          <div className="max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-20 max-lg:w-full md:max-lg:w-[320px] md:max-lg:shadow-2xl min-h-0">
            <RightSideBar onClose={() => setShowInfo(false)} onOpenImage={setLightboxSrc} />
          </div>
        )}
      </div>
      <Lightbox src={lightboxSrc} onClose={closeLightbox} />
    </div>
  );
};

export default HomePage;
