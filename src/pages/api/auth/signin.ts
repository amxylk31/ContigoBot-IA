import type { APIRoute } from "astro";
import { app } from "../../../firebase/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const auth = getAuth(app);

  /* Obtener el token de las cabeceras de la solicitud */
  const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];
  if (!idToken) {
    return new Response(
      "Token no encontrado",
      { status: 401 }
    );
  }

  /* Verificar la id del token */
  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    return new Response(
      "Token inválido",
      { status: 401 }
    );
  }

  const db = getFirestore(app);
  const uid = decodedToken.uid;
  const email = decodedToken.email;
  const displayName = decodedToken.name;

  /* Guardar o actualizar el usuario en Firestore */
  if (email) {
    try {
      const userRef = db.collection("users").doc(uid);
      await userRef.set({
        email,
        name: displayName,
      }, { merge: true }); // Usar merge para actualizar solo los campos que cambian
    } catch (error) {
      console.error("Error al guardar los datos del usuario en Firestore: ", error);
      // Opcionalmente puedes manejar el error de forma diferente
    }
  }

  /* Crear y establecer una cookie de sesión */
  const fiveDays = 60 * 60 * 24 * 5 * 1000;
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: fiveDays,
  });

  cookies.set("__session", sessionCookie, {
    path: '/',
    domain: undefined,
    expires: new Date(Date.now() + fiveDays),
    maxAge: undefined,
    httpOnly: false,
    sameSite: undefined,
    secure: undefined,
    encode: undefined
  });

  return redirect("/dashboard");
};