import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import {
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
  searchUsers,
  sendFriendRequest,
} from '../../API';
import { useAuth } from '../../lib/AuthContext';
import { getLevel, getLevelProgress } from '../../lib/LevelSystem';
import styles from '../styles/default';

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

export default function FriendsScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
      <View style={styles.topBar} />

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.buttonBackText}>Retour</Text>
      </TouchableOpacity>

      <Text style={[styles.textTitle, { marginTop: 70, marginBottom: 12 }]}>Amis</Text>

      {/* Onglets */}
      <View style={{ flexDirection: 'row', marginBottom: 16, gap: 8 }}>
        {(['classement', 'demandes', 'recherche'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={{
              paddingVertical: 7,
              paddingHorizontal: 14,
              borderRadius: 20,
              backgroundColor: tab === t ? '#FF6347' : '#f0f0f0',
            }}
          >
            <Text style={{
              color: tab === t ? '#fff' : '#555',
              fontWeight: 'bold',
              fontSize: 13,
              textTransform: 'capitalize',
            }}>
              {t}{t === 'demandes' && requests.length > 0 ? ` (${requests.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Classement ────────────────────────────────────────── */}
      {tab === 'classement' && (
        <ScrollView style={{ width: '90%' }} showsVerticalScrollIndicator={false}>
          {leaderboardLoading ? (
            <ActivityIndicator color="#FF6347" style={{ marginTop: 20 }} />
          ) : leaderboard.length === 0 ? (
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
              Ajoute des amis pour voir le classement !
            </Text>
          ) : (
            leaderboard.map((entry, index) => {
              const lvl = getLevel(entry.xp);
              const prog = getLevelProgress(entry.xp);
              return (
                <View key={entry.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: entry.isMe ? '#fff5f3' : '#fafafa',
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                  borderWidth: entry.isMe ? 1.5 : 1,
                  borderColor: entry.isMe ? '#FF6347' : '#eee',
                }}>
                  {/* Rang */}
                  <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#ccc',
                    width: 32,
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </Text>

                  {/* Infos */}
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                        {entry.pseudo}{entry.isMe ? ' (moi)' : ''}
                      </Text>
                      <View style={{
                        backgroundColor: '#FF6347',
                        borderRadius: 8,
                        paddingVertical: 2,
                        paddingHorizontal: 7,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>
                          Niv. {lvl}
                        </Text>
                      </View>
                    </View>

                    {/* Barre XP */}
                    <View style={{
                      height: 6,
                      backgroundColor: '#e0e0e0',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      <View style={{
                        width: `${Math.round(prog.progress * 100)}%`,
                        height: '100%',
                        backgroundColor: '#FF6347',
                        borderRadius: 3,
                      }} />
                    </View>
                    <Text style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>
                      {entry.xp} XP total
                    </Text>
                  </View>

                  {/* Supprimer (pas sur soi) */}
                  {!entry.isMe && (
                    <TouchableOpacity
                      onPress={() => handleRemove(entry.id)}
                      style={{ marginLeft: 8, padding: 4 }}
                    >
                      <Text style={{ color: '#ccc', fontSize: 18 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* ── Demandes reçues ───────────────────────────────────── */}
      {tab === 'demandes' && (
        <ScrollView style={{ width: '90%' }} showsVerticalScrollIndicator={false}>
          {requestsLoading ? (
            <ActivityIndicator color="#FF6347" style={{ marginTop: 20 }} />
          ) : requests.length === 0 ? (
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
              Aucune demande en attente
            </Text>
          ) : (
            requests.map(r => (
              <View key={r.id} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fafafa',
                borderRadius: 14,
                padding: 14,
                marginBottom: 10,
                borderWidth: 1,
                borderColor: '#eee',
              }}>
                <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 15 }}>{r.pseudo}</Text>
                <TouchableOpacity
                  onPress={() => handleAccept(r.id)}
                  style={{
                    backgroundColor: '#FF6347',
                    borderRadius: 20,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                    marginRight: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Accepter</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDecline(r.id)}
                  style={{
                    backgroundColor: '#f0f0f0',
                    borderRadius: 20,
                    paddingVertical: 6,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text style={{ color: '#888', fontWeight: 'bold', fontSize: 13 }}>Refuser</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      )}

      {/* ── Recherche ─────────────────────────────────────────── */}
      {tab === 'recherche' && (
        <View style={{ width: '90%' }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              placeholder="Chercher un pseudo..."
              placeholderTextColor="#aaa"
              style={{
                flex: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                fontSize: 15,
                borderWidth: 1,
                borderColor: '#e0e0e0',
              }}
            />
            <TouchableOpacity
              onPress={handleSearch}
              style={{
                backgroundColor: '#FF6347',
                borderRadius: 12,
                paddingHorizontal: 16,
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>

          {searchLoading ? (
            <ActivityIndicator color="#FF6347" />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {searchResults.map(u => (
                <View key={u.id} style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#fafafa',
                  borderRadius: 14,
                  padding: 14,
                  marginBottom: 10,
                  borderWidth: 1,
                  borderColor: '#eee',
                }}>
                  <Text style={{ flex: 1, fontWeight: 'bold', fontSize: 15 }}>{u.pseudo}</Text>
                  {u.isFriend ? (
                    <Text style={{ color: '#4CAF50', fontSize: 13, fontWeight: 'bold' }}>Ami ✓</Text>
                  ) : u.requestSent ? (
                    <Text style={{ color: '#aaa', fontSize: 13 }}>Demande envoyée</Text>
                  ) : u.requestReceived ? (
                    <TouchableOpacity
                      onPress={() => { handleAccept(u.id); setTab('classement'); }}
                      style={{
                        backgroundColor: '#FF6347',
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>Accepter</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleSendRequest(u.id)}
                      style={{
                        backgroundColor: '#FF6347',
                        borderRadius: 20,
                        paddingVertical: 6,
                        paddingHorizontal: 14,
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 13 }}>+ Ajouter</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <View style={{ height: 80 }} />
            </ScrollView>
          )}
        </View>
      )}

      <View style={styles.bottomBar} />
    </View>
  );
}
