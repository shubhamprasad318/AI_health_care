import React, { useEffect } from "react";

const Chatbot = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.botpress.cloud/webchat/v1/inject.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.botpressWebChat.init({
        botId: "8bdcb65f-498f-464c-bdeb-ec345ee97476",
        hostUrl: "https://cdn.botpress.cloud/webchat/v1",
        messagingUrl: "https://messaging.botpress.cloud",
        clientId: "8bdcb65f-498f-464c-bdeb-ec345ee97476",
      });
    };
  }, []);

  return <div id="webchat"/>;
};

export default Chatbot;
