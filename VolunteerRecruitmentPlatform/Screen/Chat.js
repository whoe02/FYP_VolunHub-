import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserContext } from '../UserContext';
import { firestore } from '../firebaseConfig';
import { collection, query, orderBy, onSnapshot, addDoc, doc, updateDoc, where, getDocs, getDoc, writeBatch, arrayUnion } from 'firebase/firestore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { Video } from 'expo-av';

const Chat = ({ route, navigation }) => {
    const { chat } = route.params;
    const { user } = useUserContext();

    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [events, setEvents] = useState([]);
    const [eventToSend, setEventToSend] = useState(route.params?.event || null);
    const [isUploading, setIsUploading] = useState(false);
    const [previewModalVisible, setPreviewModalVisible] = useState(false);
    const [fullscreenMedia, setFullscreenMedia] = useState(null);
    const [dynamicHeight, setDynamicHeight] = useState(40); // Start with minimum height

    const flatListRef = useRef();

    const fetchCategoryNames = async (categoryIds) => {
        if (!categoryIds || categoryIds.length === 0) {
            return {}; // Return empty object if no categoryIds
        }

        try {
            const categoryQuery = query(
                collection(firestore, 'Category'),
                where('__name__', 'in', categoryIds) // Use `__name__` to query by document ID
            );

            const querySnapshot = await getDocs(categoryQuery);

            const categoryMap = {};
            querySnapshot.docs.forEach((doc) => {
                const { categoryName } = doc.data(); // Get `categoryName` field
                categoryMap[doc.id] = categoryName; // Map document ID to category name
            });

            return categoryMap;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return {};
        }
    };

    const fetchOrganizationNames = async (userIds) => {
        if (userIds.length === 0) {
            return {}; // Return empty object if no userIds
        }

        try {
            const userQuery = query(
                collection(firestore, 'User'),
                where('__name__', 'in', userIds) // Use `__name__` for document IDs
            );

            const querySnapshot = await getDocs(userQuery);

            const organizationMap = {};
            querySnapshot.docs.forEach((doc) => {
                const { name } = doc.data(); // Assuming the field is `organizationName`
                organizationMap[doc.id] = name || 'Unknown Organization'; // Map userId to organization name
            });

            return organizationMap;
        } catch (error) {
            console.error('Error fetching organization names:', error);
            return {};
        }
    };

    const fetchEvents = async (eventIds) => {
        try {
            const eventQuery = query(
                collection(firestore, 'Event'),
                where('__name__', 'in', eventIds)
            );
            const querySnapshot = await getDocs(eventQuery);

            const fetchedEvents = querySnapshot.docs.map((doc) => {
                const data = doc.data();

                // Convert Firestore Timestamp fields to Date if necessary
                const startDate = data.startDate ? new Date(data.startDate.seconds * 1000) : null;
                const endDate = data.endDate ? new Date(data.endDate.seconds * 1000) : null;
                const startTime = data.startTime ? new Date(data.startTime.seconds * 1000) : null;
                const endTime = data.endTime ? new Date(data.endTime.seconds * 1000) : null;

                return {
                    id: doc.id,
                    ...data,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                };
            });

            const allCategoryIds = [
                ...new Set(fetchedEvents.flatMap((event) => event.categoryIds || [])), // Default to empty array if categoryIds is undefined
            ];

            const allUserIds = [...new Set(fetchedEvents.map((event) => event.userId))];

            // Fetch categories and organizations
            const categoryMap = await fetchCategoryNames(allCategoryIds);
            const organizationMap = await fetchOrganizationNames(allUserIds);

            // Update event data with category names
            const eventsWithDetails = fetchedEvents.map((event) => {
                // Map categories and organization name
                const mappedCategories = event.categoryIds
                    ? event.categoryIds.map((id) => categoryMap[id] || 'Unknown')
                    : [];

                const organizationName = organizationMap[event.userId] || 'Unknown Organization';

                return {
                    ...event,
                    categories: mappedCategories,
                    organizationName,
                };
            });

            setEvents(eventsWithDetails);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    useEffect(() => {
        if (eventToSend) {
            setInputMessage('I am interested in this event!');
        }

        const loadChatMessages = async () => {
            if (!chat || !chat.id) return;

            const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
            const q = query(messagesRef, orderBy('timestamp', 'asc'));

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const groupedMessages = [];
                let lastDate = null;

                // Fetch and process messages
                const rawMessages = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        timestamp: data.timestamp?.toDate(),
                    };
                });

                // Filter out placeholder messages
                const filteredMessages = rawMessages.filter((msg) => !msg.isPlaceholder);

                // Add date headers and group messages
                filteredMessages.forEach((message) => {
                    const messageDate = message.timestamp.toDateString();

                    if (messageDate !== lastDate) {
                        groupedMessages.push({
                            id: `date-${messageDate}`,
                            dateHeader: true,
                            date: messageDate,
                        });
                        lastDate = messageDate;
                    }

                    groupedMessages.push(message);
                });

                setMessages(groupedMessages);

                // Fetch events related to eventId in messages
                const eventIds = [
                    ...new Set(filteredMessages.filter((msg) => msg.eventId).map((msg) => msg.eventId)),
                ];

                if (eventIds.length > 0) {
                    await fetchEvents(eventIds);
                }
            });

            return () => unsubscribe();
        };

        loadChatMessages();
    }, [chat.id, eventToSend]);



    // Check the size of the file before uploading
    const checkFileSize = async (uri) => {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.size > 16 * 1024 * 1024) { // 16 MB limit
            Alert.alert('File too large', 'The selected file exceeds the 16 MB size limit.');
            return false;
        }
        return true;
    };


    const uploadToCloudinary = async (uri, type) => {

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', {
            uri,
            type: type.startsWith('video') ? 'video/mp4' : 'image/jpeg',
            name: uri.split('/').pop(),
        });
        formData.append('upload_preset', 'chatmedia');
        formData.append('cloud_name', 'dnj0n4m7k');

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dnj0n4m7k/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setIsUploading(false);
            return data.secure_url;
        } catch (error) {
            setIsUploading(false);
            console.error('Error uploading to Cloudinary:', error);
            return null;
        }
    };

    const sendNotification = async (recipientToken, message, name) => {
        try {
            const messageBody = {
                to: recipientToken,
                sound: 'default',
                title: name,
                body: message || '[Media]',
                data: {
                    type: 'message',
                    chat: chat,
                },
            };

            const response = await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messageBody),
            });


        } catch (error) {
            console.error('Error sending notification:', error);
        }
    };

    const sendMessage = async ({ eventId }) => {

        if (inputMessage.trim().length === 0 && !selectedImage) {
            return;
        }

        try {
            let mediaUrl = null;
            if (selectedImage) {
                const type = selectedImage.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
                mediaUrl = await uploadToCloudinary(selectedImage, type);
                if (!mediaUrl) return;
            }

            const newMessage = {
                text: inputMessage || '',
                media: mediaUrl || null,
                eventId: eventId || null,
                senderId: user.userId,
                timestamp: new Date(),
                read: false,
            };

            const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
            await addDoc(messagesRef, newMessage);

            const chatRef = doc(firestore, 'Chat', chat.id);
            await updateDoc(chatRef, {
                lastMessage: {
                    text: inputMessage || (mediaUrl ? '[Media]' : '') || (eventId ? '[Event]' : ''),
                    senderId: user.userId,
                    timestamp: new Date(),
                },
            });
            setInputMessage('');
            setSelectedImage(null);
            setPreviewModalVisible(false);
            if (eventId) {
                triggerAutoReply(eventId);
            }

            try {
                // Fetch the recipient's device token from Firestore
                const recipientRef = doc(firestore, 'User', chat.otherParticipant);
                const recipientDoc = await getDoc(recipientRef);

                if (recipientDoc.exists()) {
                    const recipientData = recipientDoc.data();
                    const recipientToken = recipientData.deviceToken;
                    const preferences = await fetchNotificationPreferences(chat.otherParticipant);
                    const isNotificationEnabled = preferences.message;
                    const oppname = chat.name;
                    if (recipientToken && isNotificationEnabled) {
                        // Send push notification to the recipient if the token exists
                        sendNotification(recipientToken, inputMessage, oppname);
                    } else {

                        console.warn(`The notification did not sent.`);

                    }
                } else {
                    console.warn(`Recipient document not found for ID: ${recipientId}`);
                }
            } catch (error) {
                console.error('Error fetching recipient data:', error);
            }

        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const fetchNotificationPreferences = async (userId) => {
        try {
            const preferencesRef = doc(firestore, 'User', userId, 'NotificationPreferences', 'Preferences');
            const preferencesSnap = await getDoc(preferencesRef);

            if (preferencesSnap.exists()) {
                return preferencesSnap.data();
            } else {
                // Assume default preferences (all true) if the subcollection does not exist
                return {
                    application: true,
                    announcement: true,
                    message: true,
                    review: true,
                };
            }
        } catch (error) {
            console.error('Error fetching notification preferences:', error);
            // Fallback to default preferences in case of error
            return {
                application: true,
                announcements: true,
                messages: true,
                review: true,
            };
        }
    };

    const triggerAutoReply = (eventId) => {
        setTimeout(async () => {
            if (!chat || !chat.id) return;

            try {
                // Fetch the event document
                const eventRef = doc(firestore, 'Event', eventId);
                const eventDoc = await getDoc(eventRef);

                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();
                    const { userId } = eventData;

                    if (!userId) {
                        console.warn('Event does not have a userId for auto-reply.');
                        return;
                    }

                    // Fetch the user document to get the autoReplyMsg
                    const userRef = doc(firestore, 'User', userId);
                    const userDoc = await getDoc(userRef);

                    let autoReplyMsg = `Thank you for your message regarding the event: ${eventData.title}. We will follow up soon!`; // Default message

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        autoReplyMsg = userData.autoReplyMsg || autoReplyMsg; // Use autoReplyMsg if it exists
                    } else {
                        console.warn('User document not found for auto-reply.');
                    }

                    // Prepare the auto-reply message
                    const autoReplyMessage = {
                        text: autoReplyMsg,
                        media: null,
                        eventId: null,
                        senderId: userId,
                        timestamp: new Date(),
                    };

                    const lastMessage = {
                        lastMessage: {
                            text: autoReplyMsg,
                            senderId: userId,
                            timestamp: new Date(),
                        },
                    }

                    // Save the auto-reply in the Firestore
                    const messagesRef = collection(firestore, 'Chat', chat.id, 'Message');
                    await addDoc(messagesRef, autoReplyMessage);

                    const chatRef = doc(firestore, 'Chat', chat.id);
                    await updateDoc(chatRef, lastMessage);
                } else {
                    console.warn('Event not found for auto-reply.');
                }
            } catch (error) {
                console.error('Error sending auto-reply:', error);
            }
        }, 2000); // 2-second delay
    };

    const pickMedia = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
            quality: 1,
        });
        if (!result.canceled && (await checkFileSize(result.assets[0].uri))) {
            setSelectedImage(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };

    const takeMedia = async () => {
        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
            quality: 1,
        });
        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            setPreviewModalVisible(true);
        }
    };
    const downloadMedia = async (uri) => {
        try {
            const fileUri = FileSystem.documentDirectory + uri.split('/').pop(); // Get file name
            await FileSystem.downloadAsync(uri, fileUri); // Download file
            await MediaLibrary.createAssetAsync(fileUri);
            Alert.alert('Success', 'File has been saved to your gallery!');
        } catch (error) {
            console.error('Error downloading file:', error);
            Alert.alert('Error', 'Failed to download file.');
        }
    };




    const renderMessage = ({ item }) => {
        // Render date headers
        if (item.dateHeader) {
            return (
                <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
            );
        }

        const isCurrentUser = item.senderId === user.userId;
        const linkedEvent = item.eventId ? events.find((event) => event.id === item.eventId) : null;
        return (
            <View style={[styles.messageContainer, isCurrentUser ? styles.myMessage : styles.otherMessage]}>
                {/* Render media content */}
                {item.media && (
                    <TouchableOpacity onPress={() => setFullscreenMedia(item.media)}>
                        {item.media.endsWith('.mp4') ? (
                            <Video
                                source={{ uri: item.media }}
                                style={styles.media}
                                resizeMode="cover"
                                shouldPlay={false}
                                isLooping
                                useNativeControls
                            />
                        ) : (
                            <Image source={{ uri: item.media }} style={styles.media} />
                        )}
                    </TouchableOpacity>
                )}

                {/* Render linked event */}
                {linkedEvent && (
                    <TouchableOpacity
                        style={isCurrentUser ? styles.eventMessage : styles.oEventMessage}
                        onPress={() => navigation.navigate('EventDetail', { event: linkedEvent, user: user })}
                    >
                        <Text style={isCurrentUser ? styles.eventMessageText : styles.oEventMessageText}>{linkedEvent.title}</Text>
                        <Text style={isCurrentUser ? styles.orgText : styles.oOrgText}>{linkedEvent.organizationName}</Text>
                    </TouchableOpacity>

                )}

                {/* Render text message */}
                {item.text && (
                    <Text style={isCurrentUser ? styles.messageText : styles.otherMessageText}>
                        {item.text}
                    </Text>
                )}

                {/* Render timestamp */}
                <Text style={isCurrentUser ? styles.myTimestamp : styles.timestamp}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        );
    };

    const renderFullscreenMedia = () => {
        if (!fullscreenMedia) return null;

        return (
            <Modal visible={true} transparent={true} onRequestClose={() => setFullscreenMedia(null)}>
                <View style={styles.fullscreenModal}>
                    {fullscreenMedia.endsWith('.mp4') ? (
                        <Video
                            source={{ uri: fullscreenMedia }}
                            style={styles.fullscreenImage}
                            resizeMode="contain"
                            shouldPlay
                            useNativeControls
                        />
                    ) : (
                        <Image source={{ uri: fullscreenMedia }} style={styles.fullscreenImage} />
                    )}
                    <TouchableOpacity onPress={() => downloadMedia(fullscreenMedia)} style={styles.downloadButton}>
                        <Ionicons name="download-outline" size={30} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setFullscreenMedia(null)} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <Image source={{ uri: chat.avatar }} style={styles.avatar} />
                <Text style={styles.header}>{chat.name}</Text>
            </View>
            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            {/* Message Input */}
            {eventToSend && (
                <View style={styles.eventContainer}>
                    <Text style={styles.eventTitle}>You are interested with : {eventToSend.title}</Text>
                    <View style={styles.eventActions}>

                        <TouchableOpacity
                            style={styles.cancelEventButton}
                            onPress={() => { setEventToSend(null); setInputMessage(''); }}
                        >
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}
            <View style={styles.inputContainer}>
                <TouchableOpacity onPress={pickMedia}>
                    <Ionicons name="image" size={30} color="#6a8a6d" />
                </TouchableOpacity>
                <TouchableOpacity onPress={takeMedia}>
                    <Ionicons name="camera" size={30} color="#6a8a6d" />
                </TouchableOpacity>
                <TextInput
                    style={styles.input}
                    placeholder="Type a message"
                    value={inputMessage}
                    onChangeText={setInputMessage}
                    multiline
                />
                <TouchableOpacity onPress={() => {
                    sendMessage({ eventId: eventToSend?.id });
                    setEventToSend(null);
                }} disabled={isUploading}>
                    {isUploading ? (
                        <ActivityIndicator size="small" color="#6a8a6d" />
                    ) : (
                        <Ionicons name="send" size={24} color="#6a8a6d" />
                    )}
                </TouchableOpacity>
            </View>
            {renderFullscreenMedia()}
            {previewModalVisible && (
                <Modal transparent={true} animationType="fade" visible={previewModalVisible}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalContent}>
                            {/* Cancel Icon */}
                            <TouchableOpacity
                                style={styles.cancelIcon}
                                onPress={() => {
                                    setPreviewModalVisible(false);
                                    setSelectedImage(null);
                                }}
                            >
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>

                            {/* Preview Media */}
                            {selectedImage?.endsWith('.mp4') ? (
                                <Video
                                    source={{ uri: selectedImage }}
                                    style={styles.previewImage}
                                    resizeMode="contain"
                                    shouldPlay
                                    useNativeControls
                                />
                            ) : (
                                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                            )}
                            <View style={styles.modalInputContainer}>
                                <TextInput
                                    style={[styles.input, { height: Math.min(150, Math.max(40, dynamicHeight)) }]}
                                    placeholder="Type a message"
                                    value={inputMessage}
                                    onChangeText={setInputMessage}
                                    multiline={true}
                                    onContentSizeChange={(e) => {
                                        setDynamicHeight(e.nativeEvent.contentSize.height); // Dynamically adjust based on content
                                    }}
                                />
                                <TouchableOpacity
                                    style={styles.sendButton}
                                    onPress={() => {
                                        sendMessage({ eventId: eventToSend?.id });
                                        setEventToSend(null);
                                    }}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Ionicons name="send" size={24} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
};

export default Chat;



const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 5,
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
        maxHeight: 150, // Set a max height for input
        minHeight: 40, // Set a min height for input
        textAlignVertical: 'center', // Align text at the top
    },
    sendButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dateHeader: {
        alignItems: 'center',
        marginVertical: 20,
    },
    dateText: {
        fontSize: 12,
        color: '#6a8a6d',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        alignItems: 'center',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 15,
    },
    previewInput: {
        width: '100%',
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#f3f3f3',
        marginBottom: 15,
        fontSize: 16,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    cancelButton: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#f44336',
        alignItems: 'center',
        marginRight: 5,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    media: {
        width: 200, // Adjust based on your layout
        height: 200,
        borderRadius: 10,
        marginBottom: 5,
    },
    fullscreenModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
    },
    fullscreenImage: {
        width: '90%',
        height: '80%',
        resizeMode: 'contain',
    },
    closeButton: {
        marginTop: 10,
        backgroundColor: '#f44336',
        padding: 10,
        borderRadius: 10,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        backgroundColor: 'white',
    },
    modalInput: {
        flex: 1,
        padding: 10,
        backgroundColor: '#e8e3df',
        borderRadius: 25,
        marginRight: 10,
    },
    sendButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
    },

    eventContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderTopWidth: 0.5,
        borderColor: '#ddd',
        backgroundColor: 'white',
        justifyContent: 'space-between',
    },
    eventTitle: {
        fontSize: 15,
        fontWeight: '500',
        color: '#333',
    },
    eventActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    sendEventButton: {
        backgroundColor: '#6a8a6d',
        padding: 10,
        borderRadius: 5,
    },
    sendButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    eventMessage: {
        backgroundColor: '#e8e3df',
        minWidth: '50%',
        padding: 5,
        borderRadius: 10,
    },
    eventMessageText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 16,
    },
    orgText: {
        color: '#333',
        fontWeight: '500',
        fontSize: 13,
    },

    oEventMessage: {
        backgroundColor: '#6a8a6d',
        minWidth: '50%',
        padding: 5,
        borderRadius: 10,
    },
    oEventMessageText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    oOrgText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 13,
    },

});
