import admin from 'firebase-admin';

// Initialize Firebase Admin once per serverless instance
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual line breaks for the private key
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    // 1. Find the QR code by its shortId
    const qrcodesRef = db.collection('qrcodes');
    const snapshot = await qrcodesRef.where('shortId', '==', id).limit(1).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'QR Code not found' });
    }

    const qrDoc = snapshot.docs[0];
    const { destinationUrl } = qrDoc.data();

    // 2. Asynchronously log the scan data
    const userAgent = req.headers['user-agent'] || 'Unknown';
    
    // We don't await this so the redirect happens instantly
    db.collection('qrcodes').doc(qrDoc.id).collection('scans').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      userAgent: userAgent,
    }).catch(console.error);

    // 3. Redirect the user
    res.redirect(302, destinationUrl);

  } catch (error) {
    console.error('Redirect Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}