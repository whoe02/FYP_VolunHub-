// MyEventTab.js
import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import myEventTabList from './MyEventTabList';

function MyEventTab({ onTabChanged }) {
    const scrollRef = useRef(null);
    const itemRef = useRef([]);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleSelectTab = (index) => {
        const selected = itemRef.current[index];
        setActiveIndex(index);

        if (selected) {
            selected.measure((x, y, width, height, pageX) => {
                scrollRef.current?.scrollTo({ x: pageX - 20, y: 0, animated: true });
            });
        }

        onTabChanged(myEventTabList[index].slug);
    };

    return (
        <View>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemWrapper}
            >
                {myEventTabList.map((item, index) => (
                    <TouchableOpacity
                        ref={(el) => (itemRef.current[index] = el)}
                        key={index}
                        style={[styles.item, activeIndex === index && styles.itemActive]}
                        onPress={() => handleSelectTab(index)}
                    >
                        <Text style={[styles.itemText, activeIndex === index && styles.itemTextActive]}>
                            {item.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

export default MyEventTab;

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: '600',
        marginTop: 15,
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
        borderColor: '#616161',
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
        color: '#616161',
    },
    itemTextActive: {
        color: 'white',
        fontWeight: '600',
    },
});