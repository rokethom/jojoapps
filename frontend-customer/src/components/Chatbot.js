import { useState } from "react";
import API from "../api/axios";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    const userMsg = { role: "user", text: input };

    setMessages([...messages, userMsg]);
    setInput("");

    const res = await API.post("/chatbot/", {
      message: input,
    });

    const botMsg = { role: "bot", text: res.data.reply };

    setMessages((prev) => [...prev, botMsg]);
  };

  return (
    <div>
      <div style={{ height: "400px", overflowY: "scroll" }}>
        {messages.map((m, i) => (
          <div key={i}>
            <b>{m.role}:</b> {m.text}
          </div>
        ))}
      </div>

      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}