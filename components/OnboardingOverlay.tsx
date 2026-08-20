import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    emoji: '🧠',
    title: 'Réponds aux questions',
    description: "Choisis la bonne réponse parmi les propositions. Une mauvaise réponse arrête la partie — enchaîne le plus de bonnes réponses possible !",
  },
  {
    emoji: '⭐',
    title: "Gagne de l'XP",
    description: "Chaque bonne réponse te rapporte de l'expérience (XP). Plus ta série de bonnes réponses est longue, plus tu en gagnes.",
  },
  {
    emoji: '📈',
    title: 'Monte de niveau',
    description: "Accumule assez d'XP pour passer au niveau supérieur. Plus ton niveau est élevé, plus les questions sont difficiles — et plus elles rapportent d'XP.",
  },
  {
    emoji: '🔑',
    title: 'Gagne des jetons',
    description: 'Chaque passage de niveau te donne un jeton de déblocage.',
  },
  {
    emoji: '✨',
    title: 'Débloque des thèmes',
    description: "Sur l'écran des thèmes, dépense tes jetons pour débloquer de nouveaux thèmes autour de Culture-generale, du plus général au plus pointu.",
  },
  {
    emoji: '👥',
    title: 'Défie tes amis',
    description: "Ajoute des amis et grimpe dans le classement par XP depuis l'écran Amis.",
  },
];

interface Props {
  onDone: () => void;
}

export default function OnboardingOverlay({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <View style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <View style={{
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 28,
        width: '85%',
        maxWidth: 360,
        alignItems: 'center',
      }}>
        <TouchableOpacity
          onPress={onDone}
          style={{ position: 'absolute', top: 12, right: 16, padding: 4 }}
        >
          <Text style={{ color: '#aaa', fontSize: 13, fontWeight: 'bold' }}>Passer</Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 48, marginBottom: 12 }}>{current.emoji}</Text>
        <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#222', marginBottom: 10, textAlign: 'center' }}>
          {current.title}
        </Text>
        <Text style={{ fontSize: 14, color: '#666', textAlign: 'center', lineHeight: 20, marginBottom: 24 }}>
          {current.description}
        </Text>

        {/* Indicateurs de progression */}
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={{
                width: 7,
                height: 7,
                borderRadius: 3.5,
                backgroundColor: i === step ? '#FF6347' : '#eee',
              }}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => (isLast ? onDone() : setStep(s => s + 1))}
          style={{
            backgroundColor: '#FF6347',
            borderRadius: 50,
            paddingVertical: 12,
            paddingHorizontal: 36,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>
            {isLast ? "C'est parti !" : 'Suivant'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
