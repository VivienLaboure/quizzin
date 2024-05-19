import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'flex-start'
      },
      button: {
        margin: 12,
        backgroundColor: '#d72323',
        width: 250,
        paddingHorizontal: 56, // Padding horizontal
        height: 45, // Hauteur du bouton
        lineHeight: 45, // Hauteur de ligne (similaire à height pour centrer verticalement le texte)
        borderRadius: 7, // Coins arrondis
        justifyContent: 'center', // Centrer le texte verticalement
        alignItems: 'center', // Centrer le texte horizontalement
        shadowColor: '#0076ff', // Couleur de l'ombre
        shadowOffset: { width: 0, height: 4 }, // Déplacement de l'ombre
        shadowOpacity: 0.39, // Opacité de l'ombre
        shadowRadius: 14, // Rayon de l'ombre
        elevation: 5, // Élévation (pour Android)
    
      },
      buttonText: {
        fontSize: 16, // Taille de la police
        color: 'white', // Couleur du texte
      },
      logo: {
        width: '100%',
        height: '40%'
      }
});