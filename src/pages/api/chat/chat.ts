import type { APIRoute } from 'astro';
import { app } from '../../../firebase/server';
import { getFirestore } from 'firebase-admin/firestore';

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const userMessage = formData.get('userMessage')?.toString();
  const aiMessage = formData.get('aiMessage')?.toString();
  const userUid = formData.get("userUid")?.toString();

  if (!userMessage || !aiMessage || !userUid) {
    return new Response('Faltan campos obligatorios', { status: 400 });
  }

  try {
    const db = getFirestore(app);
    const chatRef = db.collection('historial_chat').doc(); // Usa el uid para identificar el documento

    // Obtén el documento actual para combinar los mensajes existentes
    const doc = await chatRef.get();
    const existingData = doc.exists ? doc.data() : { messages: [] };

    // Agrega el nuevo mensaje a la lista de mensajes
    const updatedMessages = [
      ...existingData.messages,
      { userUid, userMessage, aiMessage, timestamp: new Date() }
    ];

    // Actualiza el documento con la nueva lista de mensajes
    await chatRef.set({ messages: updatedMessages });

    return new Response('Mensaje guardado', { status: 200 });
  } catch (error) {
    console.error('Error al guardar el mensaje en Firestore:', error);
    return new Response('Error al guardar el mensaje', { status: 500 });
  }
};
