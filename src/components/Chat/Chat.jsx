import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';
import '@fontsource-variable/outfit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.PUBLIC_APIKEYGEMINI;
const generativeAI = new GoogleGenerativeAI(apiKey);
const generativeModel = generativeAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const ChatBot = ({ uid }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const activateHistoryChat = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/chat/chat?uid=${uid}`);
      if (!res.ok) {
        throw new Error('Error fetching chat history');
      }
      const data = await res.json();
      const messagesArray = [];
      Object.keys(data).forEach(key => {
        if (key.startsWith('userMessage')) {
          const index = key.replace('userMessage', '');
          messagesArray.push({
            type: 'user',
            message: data[key],
            timestamp: data[`timestamp${index}`]
          });
          messagesArray.push({
            type: 'ai',
            message: data[`aiMessage${index}`] || "Mensaje de la IA no disponible",
            timestamp: data[`timestamp${index}`]
          });
        }
      });
      setChatHistory(messagesArray);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setHistoryError('No se pudo cargar el historial de chat.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const generateResponse = async () => {
    const historyString = messages.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const prompt = `
      Eres ContigoBot, un asistente de bienestar emocional, tu objetivo es 
      brindar respuestas concisas, empáticas y orientadas a apoyar a estudiantes 
      universitarios en Chile que enfrentan estrés, ansiedad o dificultades emocionales personales. 
      Ofreces consejos prácticos y recursos útiles para manejar estas situaciones, 
      recordando siempre que tu función es ofrecer apoyo y no sustituir la ayuda profesional. 
      Tus respuestas deben ser comprensivas, alentadoras y centradas en promover el bienestar emocional, 
      considerando las necesidades y recursos disponibles en Chile.
      Aquí está el historial de la conversación:\n${historyString}\n
      El usuario dice: "${input}". 
      Por favor, proporciona una respuesta empática y útil.
    `;

    try {
      const result = await generativeModel.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error al obtener la respuesta de Gemini:', error);
      return 'Lo siento, hubo un problema al procesar tu mensaje. Inténtalo de nuevo más tarde.';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (input.trim()) {
      const newMessage = { text: input, sender: 'user' };
      setMessages(prev => [...prev, newMessage]);
      setInput('');
      setLoading(true);

      try {
        const response = await generateResponse();
        const aiMessage = { text: response, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);

        await fetch('/api/chat/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            userUid: uid,
            userMessage: input,
            aiMessage: response,
          }),
        });

      } catch (error) {
        console.error('Error al agregar mensaje a Firestore:', error);
        setMessages(prev => [...prev, { text: 'Hubo un error al guardar el mensaje. Inténtalo de nuevo.', sender: 'ai' }]);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="chat-layout">
      {!showHistory ? (
        <div className="chat-container">
          <div className="messages">
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.sender}`}>
                <div className="message-content">
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && <div className="spinner"></div>}
          </div>
          <button
              className="sidebar-button"
              onClick={() => { setShowHistory(true); activateHistoryChat(); }}
            >
              Ver Historial
            </button>
          <div className="message-input-container">
            <form onSubmit={handleSubmit} className="message-form">
              <input type='hidden' name='uid' value={uid} />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="message-input"
              />
              <button type="submit" className="send-button">Enviar</button>
            </form>
          </div>
          <div className="warning-message">
            ContigoBot está en prueba. Las respuestas pueden no ser exactas. Verifica la información importante.
          </div>
        </div>
      ) : (
        <div className="history-container">
          <div className="history-header">
            <h3>Historial de Conversación</h3>
            <button
              onClick={() => setShowHistory(false)}
              className="sidebar-button"
            >
              Volver al Chat
            </button>
          </div>
          {historyLoading && <div>Cargando historial...</div>}
          {historyError && <div>{historyError}</div>}
          {chatHistory.length === 0 && !historyLoading && <div>No hay historial de conversaciones disponibles.</div>}
          <div className="chat-bubbles">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`message-bubble ${msg.type}`}>
                <ReactMarkdown>{msg.message}</ReactMarkdown>
                <div className="timestamp">{new Date(msg.timestamp).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot;
