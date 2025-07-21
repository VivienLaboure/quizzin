import { StyleSheet } from 'react-native';

const quizzPageStyle = StyleSheet.create({
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        margin: 20,
        marginBottom: 120,
    },
    button: {
        backgroundColor: '#FF6347',
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
        width: '80%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    popup: {
        backgroundColor: 'white',
        borderRadius: 30,
        paddingLeft: 30,
        paddingRight: 30,
        borderWidth: 1,
        width: '80%',
        height: '35%',
        position: 'absolute',
        top: '25%',
        left: '10%',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    buttonPopup: {
        backgroundColor: '#FF6347',
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: '80%',
        top: '15%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

export default quizzPageStyle;