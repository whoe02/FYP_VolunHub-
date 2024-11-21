const { initializeApp } = require('firebase/app');
const { getFirestore, collection, deleteDoc, doc, getDocs } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDQXdMGS7wiBcpbcrH9_yGNdakRCOTwA70",
    authDomain: "test-e6569.firebaseapp.com",
    projectId: "test-e6569",
    storageBucket: "test-e6569.appspot.com",
    messagingSenderId: "682695166796",
    appId: "1:682695166796:android:0b707e91e3286335ff9de9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to delete all documents in the Chat collection and its subcollections
const deleteAllChats = async () => {
    try {
        const chatCollection = collection(db, 'Chat');
        const chatDocs = await getDocs(chatCollection);

        for (const chatDoc of chatDocs.docs) {
            const chatId = chatDoc.id;
            console.log(`Deleting chat: ${chatId}`);

            // Get and delete all messages in the subcollection
            const messageCollection = collection(chatDoc.ref, 'Message');
            const messageDocs = await getDocs(messageCollection);

            for (const messageDoc of messageDocs.docs) {
                console.log(`Deleting message: ${messageDoc.id} in chat: ${chatId}`);
                await deleteDoc(doc(messageCollection, messageDoc.id));
            }

            // Delete the chat document
            await deleteDoc(doc(chatCollection, chatId));
        }

        console.log('All chats and their messages have been deleted.');
    } catch (error) {
        console.error('Error deleting chats:', error);
    }
};

// Run the function
deleteAllChats().then(() => {
    console.log('Deletion process completed.');
    process.exit();
});