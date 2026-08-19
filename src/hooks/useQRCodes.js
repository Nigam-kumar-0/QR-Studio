import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';

import { db } from '../config/firebase';

const COLLECTION_NAME = 'qrcodes';

export function useQRCodes(userId) {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setQrCodes([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const codes = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        setQrCodes(codes);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load QR codes:', err);
        setError(err.message || 'Failed to load QR codes.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const addQRCode = async ({
    title,
    qrData,
    type,
    design,
    sourceData,
  }) => {
    if (!userId) {
      throw new Error(
        'You must be logged in to save a QR code.'
      );
    }

    if (!qrData) {
      throw new Error(
        'QR code data is empty.'
      );
    }

    const docRef = await addDoc(
      collection(db, COLLECTION_NAME),
      {
        userId,

        title:
          title?.trim() ||
          'Untitled QR',

        qrData,

        type:
          type || 'TEXT',

        design: design || {},

        sourceData:
          sourceData || {},

        createdAt:
          serverTimestamp(),
      }
    );

    return docRef.id;
  };

  const deleteQRCode = async (id) => {
    if (!userId) {
      throw new Error(
        'You must be logged in.'
      );
    }

    if (!id) {
      throw new Error(
        'QR code ID is missing.'
      );
    }

    await deleteDoc(
      doc(db, COLLECTION_NAME, id)
    );
  };

  return {
    qrCodes,
    loading,
    error,
    addQRCode,
    deleteQRCode,
  };
}