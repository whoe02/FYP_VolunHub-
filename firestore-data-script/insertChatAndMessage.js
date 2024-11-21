const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection } = require('firebase/firestore');
const { v4: uuidv4 } = require('uuid'); // For generating random IDs

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

// Generate Chat and Message Data
const generateData = async () => {
    const chatDataList = [
        {
            participants: ["VL00001", "OG00001"],
            senderId: "VL00001",
            text: "Hello, how are you?",
            messages: [
                { senderId: "VL00001", text: "Hello, how are you?" },
                { senderId: "OG00001", text: "I’m good, thank you!" },
                { senderId: "VL00001", text: "Ok!" },
                { senderId: "VL00001", text: "I’m good too." },
            ],
        },
        {
            participants: ["VL00001", "OG00002"],
            senderId: "VL00001",
            text: "Hello, how are you? I'm fine.",
            messages: [
                { senderId: "VL00001", text: "Hello, how are you?" },
                { senderId: "OG00001", text: "I’m not good, thank you!" },
            ],
        },
        {
            participants: ["VL00002", "OG00002"],
            senderId: "VL00002",
            text: "Are you available for the event?",
            messages: [
                { senderId: "VL00002", text: "Are you available for the event?" },
                { senderId: "OG00002", text: "Yes, I’ll be there!" },
            ],
        },
        {
            participants: ["VL00003", "OG00003"],
            senderId: "VL00003",
            text: "Let’s discuss the plan.",
            messages: [
                { senderId: "VL00003", text: "Let’s discuss the plan." },
                { senderId: "OG00003", text: "Sure, what’s on your mind?" },
            ],
        },
    ];

    for (const chatData of chatDataList) {
        const chatId = uuidv4(); // Generate a unique chat ID

        // Create Chat Data
        const chatDoc = {
            chatId,
            participants: chatData.participants,
            senderId: chatData.senderId,
            text: chatData.text,
            lastMessage: {
                text: chatData.messages[chatData.messages.length - 1].text,
                senderId: chatData.messages[chatData.messages.length - 1].senderId,
                timestamp: new Date(),
            },
        };

        try {
            // Insert Chat Document
            const chatDocRef = doc(db, "Chat", chatId);
            await setDoc(chatDocRef, chatDoc);
            console.log(`Chat ${chatId} added successfully`);

            // Insert Messages in Subcollection
            for (const message of chatData.messages) {
                const messageId = uuidv4(); // Generate unique message ID
                const messageDoc = {
                    messageId,
                    senderId: message.senderId,
                    text: message.text,
                    type: "text", // Default type
                    media: "", // Empty media field
                    timestamp: new Date(),
                };

                const messageDocRef = doc(collection(chatDocRef, "Message"), messageId);
                await setDoc(messageDocRef, messageDoc);
                console.log(`Message ${messageId} added to Chat ${chatId}`);
            }
        } catch (error) {
            console.error(`Error adding data for Chat ${chatId}:`, error);
        }
    }
};

// Run the function
generateData().then(() => {
    console.log("All chats and messages inserted successfully.");
    process.exit();
});