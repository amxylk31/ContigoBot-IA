import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import './Chatbot.css';
import '@fontsource-variable/outfit';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.PUBLIC_APIKEYGEMINI;
const generativeAI = new GoogleGenerativeAI(apiKey);
const generativeModel = generativeAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const ChatBot = ({uid}) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const generateResponse = async () => {
    const historyString = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    const prompt = `
      Eres ContigoBot, un asistente de bienestar emocional, tu objetivo es 
      brindar respuestas concisas, empáticas y orientadas a apoyar a estudiantes 
      universitarios que enfrentan estrés, ansiedad o dificultades emocionales personales. 
      Ofreces consejos prácticos y recursos útiles para manejar estas situaciones, 
      recordando siempre que tu función es ofrecer apoyo y no sustituir la ayuda profesional. 
      Tus respuestas deben ser comprensivas, alentadoras y centradas en promover el bienestar emocional.
      Aquí está el historial de la conversación:\n${historyString}\n
      El usuario dice: "${input}". 
      Por favor, proporciona una respuesta empática y útil.
    `;

    try {
      const result = await generativeModel.generateContent(prompt);
      const response = result.response; // Ajusta según el formato correcto
      return response.text(); // Asegúrate de que sea una cadena
    } catch (error) {
      console.error('Error al obtener la respuesta de Gemini:', error);
      return 'Lo siento, hubo un problema al procesar tu mensaje. Inténtalo de nuevo más tarde.';
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (input.trim()) {
    }

    const newMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, newMessage]);
    setHistory(prev => [...prev, newMessage]);
    setInput('');
    setLoading(true);
    
    try {
      const response = await generateResponse();
      const aiMessage = { text: response, sender: 'ai' };
      setMessages(prev => [...prev, messages, aiMessage]); // Actualiza solo con el nuevo mensaje
      setHistory(prev => [...prev, aiMessage]);

      const res = await fetch('/api/chat/chat', {
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

      if (!res.ok) {
        throw new Error('Error al guardar el mensaje');
      }

    } catch (error) {
        console.error('Error al agregar mensaje a Firestore:', error);
        setMessages(prev => [...prev, { text: 'Hubo un error al guardar el mensaje. Inténtalo de nuevo.', sender: 'ai' }]);
    }
     finally {
      setLoading(false);
  }
};

  return (
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
      <form onSubmit={handleSubmit} className="message-form">
        <input type='hidden' name='uid' value={uid}/>
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
};

export default ChatBot;
