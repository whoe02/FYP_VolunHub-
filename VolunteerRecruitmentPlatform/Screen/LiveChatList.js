import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore } from '../firebaseConfig';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';

const LiveChatList = ({ navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();
    const [chatData, setChatData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userId = "/User/VL00001";

        // Real-time listener to fetch chats for the user
        const chatQuery = query(collection(firestore, "Chat"), where("participants", "array-contains", userId));
        const unsubscribe = onSnapshot(chatQuery, async (chatSnapshots) => {
            try {
                const chats = await Promise.all(
                    chatSnapshots.docs.map(async (chatDoc) => {
                        const chat = chatDoc.data();

                        // Get other participant
                        const otherParticipantId = chat.participants.find((id) => id !== userId);
                        const otherParticipantDoc = await getDoc(doc(firestore, "User", otherParticipantId.split("/")[2]));
                        const otherParticipant = otherParticipantDoc.data();

                        return {
                            id: chat.chatId,
                            name: otherParticipant.name,
                            avatar: otherParticipant.image,
                            lastMessage: chat.lastMessage.text,
                            rawTimestamp: chat.lastMessage.timestamp.seconds * 1000, // Use raw timestamp for sorting
                        };
                    })
                );

                // Sort chats by descending timestamp
                chats.sort((a, b) => b.rawTimestamp - a.rawTimestamp);

                // Format the timestamp after sorting
                const formattedChats = chats.map(chat => ({
                    ...chat,
                    timestamp: new Date(chat.rawTimestamp).toLocaleString('en-UK', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                }));

                setChatData(formattedChats);
            } catch (error) {
                console.error("Error fetching chats:", error);
            }
        });

        // Cleanup function to unsubscribe from the listener when the component unmounts
        return () => unsubscribe();

    }, []);

    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', { chat: item })}
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
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && chatData.length === 0) {
        return (
            <View style={[styles.container, { paddingTop: safeTop, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6a8a6d" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            <Text style={styles.header}>Live Chat</Text>
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
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 15,
        color: '#333',
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