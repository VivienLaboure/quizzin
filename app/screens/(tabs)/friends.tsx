import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '../../../API';
import Loader from '../../../components/ui/Loader';
import ScreenHeader from '../../../components/ui/ScreenHeader';
import { getLevel, getLevelProgress } from '../../../lib/LevelSystem';
import { colors, radius, spacing, typography } from '../../../lib/theme';

const MEDAL_COLOR: Record<number, string> = { 0: colors.gold, 1: colors.silver, 2: colors.bronze };

type Tab = 'classement' | 'demandes' | 'recherche';

interface FriendEntry {
  id: string;
  pseudo: string;
  xp: number;
  isMe?: boolean;
}

interface RequestEntry {
  id: string;
  pseudo: string;
}

interface SearchResult {
  id: string;
  pseudo: string;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
}

const TABS: { key: Tab; label: string }[] = [
  { key: 'classement', label: 'Classement' },
  { key: 'demandes', label: 'Demandes' },
  { key: 'recherche', label: 'Recherche' },
];

export default function FriendsScreen() {
  const [tab, setTab] = useState<Tab>('classement');

  // Classement
  const [leaderboard, setLeaderboard] = useState<FriendEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  // Demandes
  const [requests, setRequests] = useState<RequestEntry[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Recherche
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (tab === 'classement') loadLeaderboard();
    if (tab === 'demandes') loadRequests();
  }, [tab]);

  const loadLeaderboard = async () => {
    setLeaderboardLoading(true);
    try {
      const data = await getFriends() as FriendEntry[];
      setLeaderboard(data);
    } catch { /* silencieux */ }
    setLeaderboardLoading(false);
  };

  const loadRequests = async () => {
    setRequestsLoading(true);
    try {
      const data = await getFriendRequests() as RequestEntry[];
      setRequests(data);
    } catch { /* silencieux */ }
    setRequestsLoading(false);
  };

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearchLoading(true);
    try {
      const data = await searchUsers(query.trim()) as SearchResult[];
      setSearchResults(data);
    } catch { /* silencieux */ }
    setSearchLoading(false);
  };

  const handleSendRequest = async (userId: string) => {
    await sendFriendRequest(userId);
    setSearchResults(prev =>
      prev.map(u => u.id === userId ? { ...u, requestSent: true } : u)
    );
  };

  const handleAccept = async (userId: string) => {
    await acceptFriendRequest(userId);
    setRequests(prev => prev.filter(r => r.id !== userId));
    loadLeaderboard();
  };

  const handleDecline = async (userId: string) => {
    await declineFriendRequest(userId);
    setRequests(prev => prev.filter(r => r.id !== userId));
  };

  const handleRemove = async (userId: string) => {
    await removeFriend(userId);
    setLeaderboard(prev => prev.filter(f => f.id !== userId));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Amis" />

      <View style={styles.content}>
        {/* Onglets */}
        <View style={styles.tabs}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              style={[styles.tab, tab === t.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
                {t.label}{t.key === 'demandes' && requests.length > 0 ? ` (${requests.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Classement ────────────────────────────────────────── */}
        {tab === 'classement' && (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {leaderboardLoading ? (
              <Loader message="Chargement du classement..." style={styles.loader} />
            ) : leaderboard.length === 0 ? (
              <Text style={styles.emptyText}>Ajoute des amis pour voir le classement !</Text>
            ) : (
              leaderboard.map((entry, index) => {
                const lvl = getLevel(entry.xp);
                const prog = getLevelProgress(entry.xp);
                const medalColor = MEDAL_COLOR[index];
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
                return (
                  <View
                    key={entry.id}
                    style={[
                      styles.row,
                      entry.isMe && styles.rowHighlight,
                      medalColor ? { borderLeftWidth: 4, borderLeftColor: medalColor } : null,
                    ]}
                  >
                    {medalColor ? (
                      <View style={[styles.medalBadge, { backgroundColor: medalColor }]}>
                        <Text style={styles.medalBadgeText}>{medal}</Text>
                      </View>
                    ) : (
                      <Text style={styles.rank}>{medal}</Text>
                    )}

                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text style={styles.name}>{entry.pseudo}{entry.isMe ? ' (moi)' : ''}</Text>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelBadgeText}>Niv. {lvl}</Text>
                        </View>
                      </View>

                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${Math.round(prog.progress * 100)}%` }]} />
                      </View>
                      <Text style={styles.xpText}>{entry.xp} XP total</Text>
                    </View>

                    {!entry.isMe && (
                      <TouchableOpacity onPress={() => handleRemove(entry.id)} style={styles.removeButton}>
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
            <View style={styles.scrollSpacer} />
          </ScrollView>
        )}

        {/* ── Demandes reçues ───────────────────────────────────── */}
        {tab === 'demandes' && (
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {requestsLoading ? (
              <Loader message="Chargement des demandes..." style={styles.loader} />
            ) : requests.length === 0 ? (
              <Text style={styles.emptyText}>Aucune demande en attente</Text>
            ) : (
              requests.map(r => (
                <View key={r.id} style={styles.row}>
                  <Text style={styles.name}>{r.pseudo}</Text>
                  <View style={styles.rowActions}>
                    <TouchableOpacity onPress={() => handleAccept(r.id)} style={styles.pillPrimary}>
                      <Text style={styles.pillPrimaryText}>Accepter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDecline(r.id)} style={styles.pillSecondary}>
                      <Text style={styles.pillSecondaryText}>Refuser</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View style={styles.scrollSpacer} />
          </ScrollView>
        )}

        {/* ── Recherche ─────────────────────────────────────────── */}
        {tab === 'recherche' && (
          <View style={styles.list}>
            <View style={styles.searchRow}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                placeholder="Chercher un pseudo..."
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
              />
              <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
                <Text style={styles.searchButtonText}>OK</Text>
              </TouchableOpacity>
            </View>

            {searchLoading ? (
              <Loader style={styles.loader} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {searchResults.map(u => (
                  <View key={u.id} style={styles.row}>
                    <Text style={styles.name}>{u.pseudo}</Text>
                    {u.isFriend ? (
                      <Text style={styles.friendCheck}>Ami ✓</Text>
                    ) : u.requestSent ? (
                      <Text style={styles.pendingText}>Demande envoyée</Text>
                    ) : u.requestReceived ? (
                      <TouchableOpacity
                        onPress={() => { handleAccept(u.id); setTab('classement'); }}
                        style={styles.pillPrimary}
                      >
                        <Text style={styles.pillPrimaryText}>Accepter</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity onPress={() => handleSendRequest(u.id)} style={styles.pillPrimary}>
                        <Text style={styles.pillPrimaryText}>+ Ajouter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <View style={styles.scrollSpacer} />
              </ScrollView>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.lg },
  tabs: { flexDirection: 'row', marginBottom: spacing.md, gap: spacing.xs, width: '100%' },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.textSecondary, fontWeight: '700', fontSize: 12.5 },
  tabTextActive: { color: colors.white },
  list: { width: '100%' },
  loader: { marginTop: spacing.lg },
  emptyText: { ...typography.caption, textAlign: 'center', marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md - 2,
    padding: spacing.md - 2,
    marginBottom: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowHighlight: { backgroundColor: colors.primarySoft, borderColor: colors.primary, borderWidth: 1.5 },
  rank: { fontSize: 17, fontWeight: '700', color: colors.textMuted, width: 32 },
  medalBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  medalBadgeText: { fontSize: 15 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  name: { flex: 1, fontWeight: '700', fontSize: 15, color: colors.textPrimary },
  levelBadge: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm - 2,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  levelBadgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
  progressTrack: { height: 6, backgroundColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  xpText: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  removeButton: { marginLeft: spacing.sm, padding: spacing.xs },
  removeButtonText: { color: colors.border, fontSize: 18 },
  rowActions: { flexDirection: 'row', gap: spacing.xs },
  pillPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md - 2,
  },
  pillPrimaryText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  pillSecondary: {
    backgroundColor: colors.background,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: spacing.md - 2,
  },
  pillSecondaryText: { color: colors.textSecondary, fontWeight: '700', fontSize: 13 },
  friendCheck: { color: colors.success, fontSize: 13, fontWeight: '700' },
  pendingText: { color: colors.textMuted, fontSize: 13 },
  searchRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md - 4,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 11,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md - 4,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  searchButtonText: { color: colors.white, fontWeight: '700' },
  scrollSpacer: { height: 80 },
});
