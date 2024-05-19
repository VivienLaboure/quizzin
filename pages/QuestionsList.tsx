import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import styles from '../constants/MyStyles';


const QuestionsList = () => {

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Histoire</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Géographie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
                <Text style={styles.buttonText}>Culture Générale</Text>
            </TouchableOpacity>
        </View>

    );
}

export default QuestionsList;