import { StyleSheet } from 'react-native';

const themeStyle = StyleSheet.create({
    button: {
        width: '50%',
        backgroundColor: '#FF6347',
        padding: 7,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 10,
    }
});

export default themeStyle;