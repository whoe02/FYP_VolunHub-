import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserContext } from '../UserContext';
import { firestore } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';

const LiveChatList = ({ navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();
    const [chatData, setChatData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, setUser } = useUserContext();

    const countUnreadMessages = async (chatId) => {
        const messagesRef = collection(firestore, 'Chat', chatId, 'Message');
        const q = query(messagesRef, where('read', '==', false));

        try {
            const snapshot = await getDocs(q);
            const unreadMessages = snapshot.docs.filter(doc => doc.data().senderId !== user.userId);
            return unreadMessages.length; // Return the number of unread messages sent by others
        } catch (error) {
            console.error('Error counting unread messages:', error);
            return 0;
        }
    };

    const markMessagesAsRead = async (chatId) => {
        const messagesRef = collection(firestore, 'Chat', chatId, 'Message');
        const q = query(messagesRef, where('read', '==', false));
    
        try {
            const snapshot = await getDocs(q);
            const unreadMessages = snapshot.docs.filter(doc => doc.data().senderId !== user.userId);
            unreadMessages.forEach(async (messageDoc) => {
                const messageRef = doc(firestore, 'Chat', chatId, 'Message', messageDoc.id);
                // Update 'read' to true for messages not sent by the current user
                await updateDoc(messageRef, { read: true });
            });
    
            // Update the unread count for the specific chat after marking messages as read
            setChatData((prevChatData) => 
                prevChatData.map((chat) => {
                    if (chat.id === chatId) {
                        return { ...chat, unreadCount: 0 }; // Set unreadCount to 0 for this chat
                    }
                    return chat;
                })
            );
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };
    

    useEffect(() => {
        // Real-time listener to fetch chats for the user
        const chatQuery = query(
            collection(firestore, "Chat"),
            where("participants", "array-contains", user.userId),
            where("hide", '==', false)
        );

        const unsubscribe = onSnapshot(chatQuery, async (chatSnapshots) => {
            try {
                const chats = await Promise.all(
                    chatSnapshots.docs.map(async (chatDoc) => {
                        const chat = chatDoc.data();

                        // Get other participant
                        const otherParticipantId = chat.participants.find((id) => id !== user.userId);
                        const otherParticipantDoc = await getDoc(doc(firestore, "User", otherParticipantId));
                        const otherParticipant = otherParticipantDoc.data();

                        // Truncate lastMessage to 50 characters (or your preferred limit)
                        const lastMessageText = chat.lastMessage?.text || "[No message available]";
                        const truncatedLastMessage =
                            lastMessageText.length > 50
                                ? `${lastMessageText.substring(0, 30)}...`
                                : lastMessageText;

                        // Count unread messages for the current user
                        const unreadCount = await countUnreadMessages(chat.chatId);

                        return {
                            id: chat.chatId,
                            name: otherParticipant.name,
                            avatar: otherParticipant.image,
                            lastMessage: truncatedLastMessage,
                            rawTimestamp: chat.lastMessage?.timestamp?.seconds * 1000 || Date.now(), // Use raw timestamp for sorting
                            otherParticipant: otherParticipantId,
                            unreadCount, // Add unread count to chat object
                        };
                    })
                );

                // Sort chats by descending timestamp
                chats.sort((a, b) => b.rawTimestamp - a.rawTimestamp);

                // Format the timestamp after sorting
                const formattedChats = chats.map((chat) => ({
                    ...chat,
                    timestamp: new Date(chat.rawTimestamp).toLocaleString("en-UK", {
                        year: "numeric",
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                }));

                setChatData(formattedChats);
            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setLoading(false); // Ensure loading is set to false
            }
        });

        // Cleanup function to unsubscribe from the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    const renderChatItem = ({ item }) => {
        const lastMessageStyle = item.unreadCount > 0 ? { fontWeight: 900 } : { fontWeight: 'normal' }; // Darker color for unread messages
    
        return (
            <TouchableOpacity
                style={styles.chatItem}
                onPress={() => {
                    markMessagesAsRead(item.id); // Mark messages as read when the chat is opened
                    navigation.navigate('Chat', { chat: item });
                }}
                activeOpacity={0.8}
            >
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
                <View style={styles.textContainer}>
                    <View style={styles.row}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.timestamp}>
                            {item.timestamp}
                        </Text>
                    </View>
                    <Text style={[styles.lastMessage, lastMessageStyle]}>{item.lastMessage}</Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadCountText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };
    

    if (loading && chatData.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: safeTop, justifyContent: 'center', alignItems: 'center' }]} >
                <ActivityIndicator size="large" color="#6a8a6d" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            {chatData.length === 0 ? (
                <View style={styles.noChatContainer}>
                    <Text style={styles.noChatText}>No Available Chat</Text>
                </View>
            ) : (
                <FlatList
                    data={chatData}
                    keyExtractor={(item) => item.id}
                    renderItem={renderChatItem}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 20,
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6a8a6d',
    },
    timestamp: {
        fontSize: 12,
        color: '#777',
    },
    lastMessage: {
        fontSize: 14,
        color: '#555',
        marginTop: 4,
    },
    unreadBadge: {
        backgroundColor: '#ff0000',
        borderRadius: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        position: 'absolute',
        top: 25,
        right: 10,
    },
    unreadCountText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    listContent: {
        paddingBottom: 20,
    },
    noChatContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noChatText: {
        fontSize: 16,
        color: '#777',
    },
});

export default LiveChatList;
