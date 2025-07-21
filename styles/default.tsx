import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#FF6347',
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    image: {
        width: '100%',
        height: '50%',
        marginBottom: 20,
    },
    textTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    buttonExplication: {
        backgroundColor: '#FF6347',
        borderRadius: 50,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 10,
        width: '75%',
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
    topBar: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#FF6347',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#FF6347',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        padding: 8,
        marginBottom: 16,
        width: '18%',
        alignItems: 'center',
        position: 'absolute',
        top: 75,
        left: 20,
    },
    buttonBackText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: 'bold',
    }
});

export default styles;