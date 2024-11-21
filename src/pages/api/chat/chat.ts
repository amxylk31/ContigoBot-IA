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
    const chatRef = db.collection('historial_chat').doc(userUid);

    // Obtener los datos existentes para no sobrescribir
    const doc = await chatRef.get();
    const existingData = doc.exists ? doc.data() : {};

    // Contar el número de mensajes existentes
    const messageCount = Object.keys(existingData).filter(key => key.startsWith('userMessage')).length;

    // Construir nuevas claves para el nuevo mensaje
    const newMessageData = {
      [`userMessage${messageCount + 1}`]: userMessage,
      [`aiMessage${messageCount + 1}`]: aiMessage,
      [`timestamp${messageCount + 1}`]: new Date().toISOString(),
    };

    // Actualizar el documento con el nuevo mensaje
    await chatRef.set(newMessageData, { merge: true });

    return new Response('Mensaje guardado', { status: 200 });
  } catch (error) {
    console.error('Error al guardar el mensaje en Firestore:', error);
    return new Response('Error al guardar el mensaje', { status: 500 });
  }
};

export const GET: APIRoute = async ({ request }) => {
  const { searchParams } = new URL(request.url);
  const userUid = searchParams.get('uid');

  if (!userUid) {
    return new Response('Faltan campos obligatorios', { status: 400 });
  }

  try {
    const db = getFirestore(app);
    const chatRef = db.collection('historial_chat').doc(userUid);
    const doc = await chatRef.get();

    if (!doc.exists) {
      return new Response('No hay conversaciones', { status: 404 });
    }

    const data = doc.data();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    console.error('Error al obtener el historial de conversaciones:', error);
    return new Response('Error al obtener el historial', { status: 500 });
  }
};
