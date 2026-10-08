import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { GetDifficultyName } from '../../lib/GetDifficultyName';
import { getThemeDisplayName } from '../../lib/getThemeDisplayName';
import { getLevel, getLevelProgress, getLevelThreshold, getTokensForLevel } from '../../lib/LevelSystem';
import { colors, gradients, radius, spacing, typography } from '../../lib/theme';

export default function ResultatsPage() {
  const router = useRouter();
  const { category, difficulty, score, xpBefore, xpGained } = useLocalSearchParams();

  const safeCategory = Array.isArray(category) ? category[0] : String(category);
  const safeDifficulty = Number(Array.isArray(difficulty) ? difficulty[0] : difficulty);
  const safeScore = Number(Array.isArray(score) ? score[0] : score);
  const safeXpBefore = Number(Array.isArray(xpBefore) ? xpBefore[0] : xpBefore ?? 0);
  const safeXpGained = Number(Array.isArray(xpGained) ? xpGained[0] : xpGained ?? 0);
  const xpAfter = safeXpBefore + safeXpGained;

  const levelBefore = getLevel(safeXpBefore);
  const levelAfter = getLevel(xpAfter);
  const didLevelUp = levelAfter > levelBefore;
  const tokensGained = getTokensForLevel(levelAfter) - getTokensForLevel(levelBefore);

  const progressBefore = getLevelProgress(safeXpBefore);
  const progressAfter = getLevelProgress(xpAfter);

  // Niveau affiché (change après l'animation de level-up)
  const [displayLevel, setDisplayLevel] = useState(levelBefore);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Animated values
  const barAnim = useRef(new Animated.Value(progressBefore.progress)).current;
  const levelUpOpacity = useRef(new Animated.Value(0)).current;
  const xpLabelAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (safeXpGained <= 0) return;

    // Petit délai avant de lancer l'animation
    const timeout = setTimeout(() => {
      if (!didLevelUp) {
        // Pas de level-up : simple remplissage de progressBefore → progressAfter
        Animated.timing(barAnim, {
          toValue: progressAfter.progress,
          duration: 900,
          useNativeDriver: false,
        }).start();
      } else {
        // Level-up : 1) remplir jusqu'à 100 %, 2) flash + changement de niveau, 3) remplir nouveau niveau
        Animated.timing(barAnim, {
          toValue: 1,
          duration: Math.round(600 * (1 - progressBefore.progress)),
          useNativeDriver: false,
        }).start(() => {
          setShowLevelUp(true);
          setDisplayLevel(levelAfter);

          Animated.sequence([
            Animated.timing(levelUpOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
            Animated.delay(800),
            Animated.timing(levelUpOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]).start();

          // Réinitialiser la barre et remplir le niveau suivant
          barAnim.setValue(0);
          Animated.timing(barAnim, {
            toValue: progressAfter.progress,
            duration: 700,
            useNativeDriver: false,
          }).start();
        });
      }

      // Compteur "+N XP" qui monte
      Animated.timing(xpLabelAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }, 400);

    return () => clearTimeout(timeout);
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // XP dans le niveau affiché
  const displayProgress = displayLevel === levelAfter ? progressAfter : progressBefore;

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{safeScore > 0 ? '🎉' : '💪'}</Text>
      <Text style={typography.h1}>Résultats</Text>
      <Text style={styles.metaText}>Catégorie : {getThemeDisplayName(safeCategory)}</Text>
      <Text style={styles.metaText}>Difficulté : {GetDifficultyName(safeDifficulty)}</Text>
      <Text style={styles.scoreText}>
        {safeScore} bonne{safeScore > 1 ? 's' : ''} réponse{safeScore > 1 ? 's' : ''}
      </Text>

      <Card gradient={gradients.sunset} style={styles.xpCard}>
        <View style={styles.xpHeader}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>Niv. {displayLevel}</Text>
          </View>

          {safeXpGained > 0 && (
            <Animated.Text style={{
              color: colors.textOnColor,
              fontWeight: 'bold',
              fontSize: 16,
              opacity: xpLabelAnim,
              transform: [{
                translateY: xpLabelAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
              }],
            }}>
              +{safeXpGained} XP
            </Animated.Text>
          )}
        </View>

        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: barWidth }]} />
        </View>

        <Text style={styles.progressLabel}>
          {displayProgress.currentXp} / {displayProgress.neededXp} XP
          {' '}(niveau suivant : {getLevelThreshold(displayLevel + 1)} XP)
        </Text>
      </Card>

      {showLevelUp && (
        <Animated.View style={[styles.levelUpBannerPosition, { opacity: levelUpOpacity }]}>
          <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.levelUpBanner}>
            <Text style={styles.levelUpTitle}>NIVEAU {levelAfter} !</Text>
            <Text style={styles.levelUpSubtitle}>Bravo, tu as monté de niveau !</Text>
            {/* Un jeton tous les 2 niveaux : peut être 0 sur un level-up donné */}
            {tokensGained > 0 && (
              <Text style={styles.levelUpTokens}>
                🔑 +{tokensGained} jeton{tokensGained > 1 ? 's' : ''} de déblocage !
              </Text>
            )}
          </LinearGradient>
        </Animated.View>
      )}

      <Button
        label="Retour à l'accueil"
        onPress={() => router.push({ pathname: '/screens/home' })}
        style={styles.homeButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emoji: { fontSize: 40, marginBottom: spacing.xs },
  metaText: { fontSize: 15, color: colors.textSecondary, marginBottom: 2 },
  scoreText: { fontSize: 26, fontWeight: '800', color: colors.primary, marginTop: spacing.sm, marginBottom: spacing.xl },
  xpCard: { width: '85%', marginBottom: spacing.xl },
  xpHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  levelBadge: {
    backgroundColor: 'rgba(255,255,255,0.24)',
    borderRadius: radius.md - 4,
    paddingVertical: 4,
    paddingHorizontal: spacing.sm + 2,
  },
  levelBadgeText: { color: colors.textOnColor, fontWeight: '700', fontSize: 14 },
  progressTrack: {
    width: '100%',
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: { height: '100%', backgroundColor: colors.white, borderRadius: radius.full },
  progressLabel: { fontSize: 12, color: colors.textOnColorMuted, textAlign: 'right' },
  levelUpBannerPosition: {
    position: 'absolute',
    top: '28%',
    left: '10%',
    right: '10%',
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  levelUpBanner: {
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  levelUpTitle: { color: '#5C3D00', fontSize: 28, fontWeight: '800' },
  levelUpSubtitle: { color: '#5C3D00', fontSize: 14, marginTop: spacing.xs },
  levelUpTokens: { color: '#5C3D00', fontSize: 14, marginTop: spacing.sm, fontWeight: '700' },
  homeButton: { width: '85%' },
});
