import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios'; // Import Axios
import { firestore } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as mime from 'mime';

const Chat = ({ route }) => {
    const { chat } = route.params;
    const currentUserId = "/User/VL00001";
    const { top: safeTop } = useSafeAreaInsets();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const allowedFileTypes = ['application/pdf', 'application/zip', 'application/vnd.android.package-archive'];

    useEffect(() => {
        const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const groupedMessages = snapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                const date = new Date(data.timestamp.toDate()).toDateString(); // Group by date
                if (!acc[date]) acc[date] = [];
                acc[date].push({
                    id: doc.id,
                    text: data.text,
                    sender: data.senderId,
                    timestamp: data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: data.type,
                    media: data.media || null,
                });
                return acc;
            }, {});

            setMessages(Object.entries(groupedMessages));
        });

        return () => unsubscribe();
    }, [chat.id]);

    const uploadToCloudinary = async (uri, resourceType, mimeType) => {
        const formData = new FormData();
        formData.append('file', {
            uri: uri,
            type: mimeType, // Detected MIME type
            name: `upload.${mime.getExtension(mimeType)}`, // File extension
        });
        formData.append('upload_preset', 'chatmedia'); // Replace with your Cloudinary upload preset
        formData.append('cloud_name', 'dnj0n4m7k'); // Replace with your Cloudinary cloud name
        if (resourceType === 'raw') formData.append('resource_type', 'raw');
    
        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dnj0n4m7k/${resourceType}/upload`, {
                    method: 'POST',
                    body: formData,
                }
            );
            return response.data.secure_url; // Return the uploaded URL
        } catch (error) {
            console.error('Error uploading to Cloudinary:', error.response?.data || error.message);
            return null;
        }
    };  
    const sendMessage = async (type = 'text', media = '') => {
        if (type === 'text' && inputMessage.trim().length === 0) return;

        const newMessage = {
            text: type === 'text' ? inputMessage : '',
            senderId: currentUserId,
            timestamp: new Date(),
            type,
            media,
        };

        const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
        await addDoc(messagesRef, newMessage);

        const chatRef = doc(firestore, 'Chat', chat.id);
        await updateDoc(chatRef, {
            lastMessage: {
                text: type === 'text' ? inputMessage : `[${type}]`,
                senderId: currentUserId,
                timestamp: new Date(),
            },
        });

        setInputMessage('');
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
        if (!result.canceled) {
            const fileType = mime.getType(result.assets[0].uri); // Get MIME type
            const cloudinaryUrl = await uploadToCloudinary(result.assets[0].uri, 'image', fileType);
            if (cloudinaryUrl) {
                sendMessage('image', cloudinaryUrl);
            }
        }
    };
    
    const pickDocument = async () => {
        const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
        if (result.type !== 'cancel') {
            const fileType = mime.getType(result.name);
            if (!fileType || (!allowedFileTypes.includes(fileType) && !allowedImageTypes.includes(fileType))) {
                alert('Invalid file type. Only PDF, ZIP, APK, and supported images are allowed.');
                return;
            }
            const resourceType = allowedImageTypes.includes(fileType) ? 'image' : 'raw';
            const cloudinaryUrl = await uploadToCloudinary(result.uri, resourceType, fileType);
            if (cloudinaryUrl) {
                sendMessage(resourceType === 'image' ? 'image' : 'file', cloudinaryUrl);
            }
        }
    };
    const renderMessage = ({ item }) => {
        const isCurrentUser = item.sender === currentUserId;

        return (
            <View style={[styles.messageContainer, isCurrentUser ? styles.myMessage : styles.otherMessage]}>
                {item.type === 'text' && (
                    <Text style={isCurrentUser ? styles.messageText : styles.otherMessageText}>{item.text}</Text>
                )}
                {item.type === 'image' && (
                    <Image source={{ uri: item.media }} style={styles.media} />
                )}
                {item.type === 'file' && (
                    <TouchableOpacity onPress={() => alert(`Open file: ${item.media}`)}>
                        <Text style={isCurrentUser ? styles.messageText : styles.otherMessageText}>📎 File</Text>
                    </TouchableOpacity>
                )}
                <Text style={isCurrentUser ? styles.myTimestamp : styles.timestamp}>{item.timestamp}</Text>
            </View>
        );
    };

    const renderDateHeader = ({ item }) => (
        <View style={styles.dateHeader}>
            <Text style={styles.dateText}>{item[0]}</Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            <View style={styles.headerContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                <Text style={styles.header}>{chat.name}</Text>
            </View>

            <FlatList
                data={messages}
                keyExtractor={(item) => item[0]}
                renderItem={({ item }) => (
                    <>
                        {renderDateHeader({ item })}
                        {item[1].map((message) => renderMessage({ item: message }))}
                    </>
                )}
                style={styles.messageList}
            />

            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pickImage}>
                    <Ionicons name="camera" size={24} color="#6a8a6d" style={styles.icon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={pickDocument}>
                    <MaterialIcons name="attach-file" size={24} color="#6a8a6d" style={styles.icon} />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    value={inputMessage}
                    onChangeText={setInputMessage}
                />
                <TouchableOpacity onPress={() => sendMessage('text')} style={styles.sendButton}>
                    <Ionicons name="send" size={24} color="#fff" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default Chat;


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 15,
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        backgroundColor: 'white',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6a8a6d',
    },
    messageList: {
        flex: 1,
        paddingHorizontal: 10,
    },
    messageContainer: {
        maxWidth: '75%',
        minWidth: '20%',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        marginVertical: 5,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#6a8a6d',
    },
    otherMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#e8e3df',
    },
    messageText: {
        fontSize: 16,
        color: 'white',
    },
    otherMessageText: {
        fontSize: 16,
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        color: '#777',
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    myTimestamp: {
        fontSize: 10,
        color: 'white',
        alignSelf: 'flex-end',
        marginTop: 3,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderTopWidth: 0.5,
        borderColor: '#ddd',
        backgroundColor: 'white',
    },
    input: {
        flex: 1,
        padding: 10,
        backgroundColor: '#e8e3df',
        borderRadius: 25,
        marginHorizontal: 10,
    },
    sendButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        marginHorizontal: 5,
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dateText: {
        fontSize: 12,
        color: '#6a8a6d',
    },
    media: {
        width: 200,
        height: 150,
        borderRadius: 10,
    },
});