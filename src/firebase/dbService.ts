import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  updateDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureFirebaseAuth } from './config';
import { Ticket, ITAsset, UserAccount, KBArticle, TicketComment } from '../types';
import { INITIAL_TICKETS, INITIAL_ASSETS, INITIAL_USERS, INITIAL_KB_ARTICLES } from '../data/mockData';
import {
  loadTickets as loadLocalTickets,
  saveTickets as saveLocalTickets,
  loadAssets as loadLocalAssets,
  saveAssets as saveLocalAssets,
  loadUsers as loadLocalUsers,
  saveUsers as saveLocalUsers,
  loadKBArticles as loadLocalKBArticles,
  saveKBArticles as saveLocalKBArticles,
  getDeletedUserIds,
  recordDeletedUserId,
} from '../utils/storage';

const TICKETS_COLLECTION = 'tickets';
const ASSETS_COLLECTION = 'assets';
const USERS_COLLECTION = 'users';
const KB_COLLECTION = 'kbArticles';

// ==========================================
// SEEDING & PURGE HELPERS
// ==========================================

/**
 * Manually loads mock/sample data into Firestore on user demand.
 */
export async function seedSampleDataToFirestore(): Promise<void> {
  try {
    await ensureFirebaseAuth();

    // 1. Seed Tickets
    const tBatch = writeBatch(db);
    INITIAL_TICKETS.forEach((t) => {
      const docRef = doc(db, TICKETS_COLLECTION, t.id);
      tBatch.set(docRef, t);
    });
    await tBatch.commit();

    // 2. Seed Assets
    const aBatch = writeBatch(db);
    INITIAL_ASSETS.forEach((a) => {
      const docRef = doc(db, ASSETS_COLLECTION, a.id);
      aBatch.set(docRef, a);
    });
    await aBatch.commit();

    // 3. Seed Users
    const uBatch = writeBatch(db);
    INITIAL_USERS.forEach((u) => {
      const docRef = doc(db, USERS_COLLECTION, u.id);
      uBatch.set(docRef, u);
    });
    await uBatch.commit();

    // 4. Seed KB Articles
    const kbBatch = writeBatch(db);
    INITIAL_KB_ARTICLES.forEach((kb) => {
      const docRef = doc(db, KB_COLLECTION, kb.id);
      kbBatch.set(docRef, kb);
    });
    await kbBatch.commit();
  } catch (err) {
    console.error('Error seeding sample data to Firestore:', err);
    throw err;
  }
}

/**
 * Completely purges all tickets and hardware assets from Firestore
 * so staff can input genuine organizational data cleanly.
 */
export async function purgeAllDemoDataFromFirestore(): Promise<void> {
  try {
    await ensureFirebaseAuth();

    // Delete all tickets
    const ticketSnap = await getDocs(collection(db, TICKETS_COLLECTION));
    if (!ticketSnap.empty) {
      const batch = writeBatch(db);
      ticketSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    saveLocalTickets([]);

    // Delete all assets
    const assetSnap = await getDocs(collection(db, ASSETS_COLLECTION));
    if (!assetSnap.empty) {
      const batch = writeBatch(db);
      assetSnap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    saveLocalAssets([]);

    // Ensure non-admin demo staff are cleared, but keep primary admin accounts for login
    const userSnap = await getDocs(collection(db, USERS_COLLECTION));
    if (!userSnap.empty) {
      const batch = writeBatch(db);
      userSnap.forEach((d) => {
        const u = d.data() as UserAccount;
        // Keep active Admin users so admin doesn't get locked out
        if (u.role !== 'Admin') {
          batch.delete(d.ref);
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Error purging demo data from Firestore:', err);
    throw err;
  }
}

/**
 * Delete all tickets from Firestore in batch
 */
export async function deleteAllTicketsFromFirestore(): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const snap = await getDocs(collection(db, TICKETS_COLLECTION));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    saveLocalTickets([]);
  } catch (err) {
    console.error('Error deleting all tickets:', err);
    throw err;
  }
}

/**
 * Delete all assets from Firestore in batch
 */
export async function deleteAllAssetsFromFirestore(): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const snap = await getDocs(collection(db, ASSETS_COLLECTION));
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
    saveLocalAssets([]);
  } catch (err) {
    console.error('Error deleting all assets:', err);
    throw err;
  }
}

// ==========================================
// TICKETS REALTIME SYNC & OPERATIONS
// ==========================================

export function subscribeTickets(
  onData: (tickets: Ticket[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, TICKETS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const tickets: Ticket[] = [];
          snapshot.forEach((docSnap) => {
            tickets.push(docSnap.data() as Ticket);
          });
          tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          saveLocalTickets(tickets);
          onData(tickets);
        } else {
          saveLocalTickets([]);
          onData([]);
        }
      },
      (err) => {
        console.warn('Firestore ticket listener error, falling back to local storage:', err);
        if (onError) onError(err);
        onData(loadLocalTickets());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to tickets:', e);
    onData(loadLocalTickets());
    return () => {};
  }
}

export async function saveTicketToFirestore(ticket: Ticket): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, TICKETS_COLLECTION, ticket.id);
    await setDoc(docRef, ticket, { merge: true });
  } catch (err) {
    console.error('Error saving ticket to Firestore:', err);
  }
}

export async function deleteTicketFromFirestore(ticketId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting ticket from Firestore:', err);
  }
}

export async function addCommentToTicketInFirestore(
  ticketId: string,
  comment: TicketComment,
  existingComments: TicketComment[]
): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, TICKETS_COLLECTION, ticketId);
    const updatedComments = [...existingComments, comment];
    await updateDoc(docRef, {
      comments: updatedComments,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Error adding comment to Firestore:', err);
  }
}

// ==========================================
// ASSET DIRECTORY (13 FIELDS) REALTIME SYNC
// ==========================================

export function subscribeAssets(
  onData: (assets: ITAsset[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, ASSETS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const assets: ITAsset[] = [];
          snapshot.forEach((docSnap) => {
            assets.push(docSnap.data() as ITAsset);
          });
          assets.sort((a, b) => a.employeeName.localeCompare(b.employeeName));
          saveLocalAssets(assets);
          onData(assets);
        } else {
          saveLocalAssets([]);
          onData([]);
        }
      },
      (err) => {
        console.warn('Firestore asset listener error, falling back to local:', err);
        if (onError) onError(err);
        onData(loadLocalAssets());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to assets:', e);
    onData(loadLocalAssets());
    return () => {};
  }
}

export async function saveAssetToFirestore(asset: ITAsset): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, ASSETS_COLLECTION, asset.id);
    await setDoc(docRef, asset, { merge: true });
  } catch (err) {
    console.error('Error saving asset to Firestore:', err);
  }
}

export async function deleteAssetFromFirestore(assetId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, ASSETS_COLLECTION, assetId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting asset from Firestore:', err);
  }
}

// ==========================================
// USER ACCOUNTS REALTIME SYNC
// ==========================================

export function subscribeUsers(
  onData: (users: UserAccount[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, USERS_COLLECTION);
    return onSnapshot(
      colRef,
      async (snapshot) => {
        const deletedIds = getDeletedUserIds();

        if (!snapshot.empty) {
          const firestoreUsers: UserAccount[] = [];
          snapshot.forEach((docSnap) => {
            const u = docSnap.data() as UserAccount;
            if (!deletedIds.has(u.id)) {
              firestoreUsers.push(u);
            }
          });

          // Ensure default admin is present
          const hasAdmin = firestoreUsers.some(u => u.email.toLowerCase() === 'it@elimishawatoto.org');
          if (!hasAdmin) {
            const defaultAdmin: UserAccount = {
              id: 'usr-admin-1',
              name: 'Elimisha IT Administrator',
              email: 'it@elimishawatoto.org',
              role: 'Admin',
              department: 'IT',
              status: 'Active',
              dateAdded: '1/15/2026',
              password: 'ITEWF@2026',
            };
            firestoreUsers.unshift(defaultAdmin);
          }

          firestoreUsers.sort((a, b) => a.name.localeCompare(b.name));
          saveLocalUsers(firestoreUsers);
          onData(firestoreUsers);
        } else {
          // If Firestore is empty, seed ONLY the main administrator account
          const defaultAdmin: UserAccount = {
            id: 'usr-admin-1',
            name: 'Elimisha IT Administrator',
            email: 'it@elimishawatoto.org',
            role: 'Admin',
            department: 'IT',
            status: 'Active',
            dateAdded: '1/15/2026',
            password: 'ITEWF@2026',
          };
          saveLocalUsers([defaultAdmin]);
          onData([defaultAdmin]);

          try {
            await ensureFirebaseAuth();
            const docRef = doc(db, USERS_COLLECTION, defaultAdmin.id);
            await setDoc(docRef, defaultAdmin);
          } catch (seedErr) {
            console.warn('Init admin in Firestore note:', seedErr);
          }
        }
      },
      (err) => {
        console.warn('Firestore users listener error, falling back to local:', err);
        if (onError) onError(err);
        onData(loadLocalUsers());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to users:', e);
    onData(loadLocalUsers());
    return () => {};
  }
}

export async function saveUserToFirestore(user: UserAccount): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, USERS_COLLECTION, user.id);
    await setDoc(docRef, user, { merge: true });
  } catch (err) {
    console.error('Error saving user to Firestore:', err);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  try {
    recordDeletedUserId(userId);
    const updated = loadLocalUsers().filter((u) => u.id !== userId);
    saveLocalUsers(updated);

    await ensureFirebaseAuth();
    const docRef = doc(db, USERS_COLLECTION, userId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting user from Firestore:', err);
  }
}

// ==========================================
// KB ARTICLES REALTIME SYNC
// ==========================================

export function subscribeKBArticles(
  onData: (articles: KBArticle[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  try {
    const colRef = collection(db, KB_COLLECTION);
    return onSnapshot(
      colRef,
      async (snapshot) => {
        if (!snapshot.empty) {
          const articles: KBArticle[] = [];
          snapshot.forEach((docSnap) => {
            articles.push(docSnap.data() as KBArticle);
          });
          saveLocalKBArticles(articles);
          onData(articles);
        } else {
          const local = loadLocalKBArticles();
          if (local.length > 0) {
            saveLocalKBArticles(local);
            onData(local);
            try {
              await ensureFirebaseAuth();
              const batch = writeBatch(db);
              local.forEach((k) => {
                const docRef = doc(db, KB_COLLECTION, k.id);
                batch.set(docRef, k, { merge: true });
              });
              await batch.commit();
            } catch (seedErr) {
              console.warn('Auto-sync initial KB articles error:', seedErr);
            }
          } else {
            saveLocalKBArticles([]);
            onData([]);
          }
        }
      },
      (err) => {
        console.warn('Firestore KB listener error, falling back to local:', err);
        if (onError) onError(err);
        onData(loadLocalKBArticles());
      }
    );
  } catch (e) {
    console.warn('Failed to subscribe to KB articles:', e);
    onData(loadLocalKBArticles());
    return () => {};
  }
}

export async function saveKBArticleToFirestore(article: KBArticle): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, KB_COLLECTION, article.id);
    await setDoc(docRef, article, { merge: true });
  } catch (err) {
    console.error('Error saving KB article to Firestore:', err);
  }
}

export async function deleteKBArticleFromFirestore(articleId: string): Promise<void> {
  try {
    await ensureFirebaseAuth();
    const docRef = doc(db, KB_COLLECTION, articleId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Error deleting KB article from Firestore:', err);
  }
}
