import React, { useRef, useState } from 'react'
import { View, Text, Button, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import homeTabList from './HomeTabList';


function HomeTab({onTabChanged}) {
    const scrollRef = useRef(null);
    const itemRef = useRef([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleSelectTab = (index) => {
        const selected = itemRef.current[index];
        setActiveIndex(index);

        // Ensure that the item exists
        if (selected) {
            // Measure the item to get its position
            selected.measure((x, y, width, height, pageX, pageY) => {
                // Scroll to the x position of the selected item
                scrollRef.current?.scrollTo({ x: pageX - 20 , y: 0, animated: true });
            });
        }

        onTabChanged(homeTabList[index].slug);
    };

   
    return (
        <View>
            <Text style={styles.title}>Discover Volunteer Event</Text>
            <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemWrapper}>
                {homeTabList.map((item, index) => (
                    <TouchableOpacity ref={(el) => (itemRef.current[index] = el)} key={index} style={[styles.item, activeIndex === index && styles.itemActive]} onPress={() => handleSelectTab(index)}>
                        <Text style={[styles.itemText, activeIndex === index && styles.itemTextActive]}>{item.title}</Text>
                    </TouchableOpacity>

                ))}
            </ScrollView>
        </View>
    )
}

export default HomeTab

const styles = StyleSheet.create({
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 10,
        marginLeft: 20,
    },
    itemWrapper: {
        gap: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    item: {
        borderWidth: 1,
        borderColor: "#616161",
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 10,
    },
    itemActive: {
        backgroundColor: '#6a8a6d',
        borderColor: '#6a8a6d',
    },
    itemText: {
        fontSize: 14,
        color: "#616161",
    },
    itemTextActive: {
        color: "white",
        fontWeight: '600',
    }
})
