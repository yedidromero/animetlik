// app/(tabs)/profile.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  Platform,
  TextInput,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import { useAccount, useDisconnect, useWalletClient, useBalance } from 'wagmi';

type Plan = 'Free' | 'Premium' | 'VIP';
const USERNAME_KEY = 'profile:username';
const PLAN_KEY = 'profile:plan';

/* ========= Header con tu logo ========= */
function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

/* ========= Fila reutilizable de la tarjeta ========= */
function ProfileRow({
  icon,
  label,
  right,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
}) {
  const Wrapper: any = onPress ? Pressable : View;
  return (
    <Wrapper onPress={onPress} style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color="#2a1a0a" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {right}
    </Wrapper>
  );
}

/* ========= Opción de plan (card fila del modal) ========= */
function PlanOption({
  title,
  icon,
  bullets = [],
  selected,
  onSelect,
}: {
  title: Plan;
  icon: React.ReactNode;
  bullets?: string[];
  selected?: boolean;
  onSelect: (p: Plan) => void;
}) {
  return (
    <Pressable onPress={() => onSelect(title)} style={[styles.planRow, selected && { opacity: 0.95 }]}>
      <View style={[styles.bigIcon, selected && { borderColor: '#13c000' }]}>
        {icon}
        {selected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.planTitle}>{title}</Text>
        {bullets.map((b, i) => (
          <Text key={i} style={styles.bullet}>{'\u2022'} {b}</Text>
        ))}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

  const isReadyConnected = useMemo(
    () => Boolean(isConnected && address && walletClient),
    [isConnected, address, walletClient]
  );

  /* ===== Username (editable + persistente) ===== */
  const [username, setUsername] = useState<string>('');
  const [draft, setDraft] = useState<string>('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(USERNAME_KEY).then((v) => {
      if (v) {
        setUsername(v);
        setDraft(v);
      }
    });
    AsyncStorage.getItem(PLAN_KEY).then((v) => {
      if (v === 'Free' || v === 'Premium' || v === 'VIP') setPlan(v);
    });
  }, []);

  const handleSaveUsername = async () => {
    const value = draft.trim();
    setUsername(value);
    setEditing(false);
    await AsyncStorage.setItem(USERNAME_KEY, value);
  };
  const handleCancelEdit = () => {
    setDraft(username);
    setEditing(false);
  };

  /* ===== Balance MON con wagmi useBalance ===== */
  const { data: balData, isLoading: balLoading, isError: balError } = useBalance({
    address,
    chainId: 10143,     // Monad Testnet (ajusta o elimina para usar la chain actual)
    watch: true,
    enabled: !!address,
    scopeKey: 'mon-balance',
  });

  const displayMON = balLoading
    ? 'cargando…'
    : balError
    ? '— MON'
    : balData
    ? `${Number(balData.formatted).toFixed(4)} MON`
    : '— MON';

  const shortAddr = (addr?: string) =>
    addr ? `${addr.slice(0, 10)}…` : '';

  /* ===== Plan (estado + modal) ===== */
  const [plan, setPlan] = useState<Plan>('VIP');
  const [plansVisible, setPlansVisible] = useState(false);

  const planChipColors = (p: Plan) => {
    switch (p) {
      case 'Free':    return { bg: '#ffe7c2', fg: '#2a1a0a' };
      case 'Premium': return { bg: '#ffd974', fg: '#2a1a0a' };
      case 'VIP':     return { bg: '#ffc94d', fg: '#2a1a0a' };
    }
  };

  const selectPlan = async (p: Plan) => {
    setPlan(p);
    await AsyncStorage.setItem(PLAN_KEY, p);
    setPlansVisible(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('@/assets/images/fondo.png')}
        resizeMode="cover"
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        {/* Header con logo */}
        <AppHeader
          right={
            isReadyConnected ? (
              <>
                <Text style={styles.addressTiny}>
                  {`${address!.slice(0, 6)}…${address!.slice(-4)}`}
                </Text>
                <TouchableOpacity onPress={() => disconnect()} style={styles.logoutBtn}>
                  <Text style={styles.logoutLabel}>Disconnect</Text>
                </TouchableOpacity>
              </>
            ) : null
          }
        />

        {/* Contenido */}
        <View style={styles.container}>
          <Text style={styles.userTitle}>User</Text>

          {/* Avatar */}
          <View style={styles.avatar}>
            <Ionicons name="person" size={56} color="#111" />
          </View>

          {/* Address pill */}
          {isReadyConnected && (
            <View style={styles.addrPill}>
              <Text style={styles.addrPillText}>{shortAddr(address!)}</Text>
            </View>
          )}

          {/* Tarjeta */}
          {isReadyConnected ? (
            <View style={styles.card}>
              {/* username */}
              <ProfileRow
                icon="create-outline"
                label="username"
                right={
                  editing ? (
                    <View style={styles.editWrap}>
                      <TextInput
                        value={draft}
                        onChangeText={setDraft}
                        placeholder="nombre de usuario"
                        placeholderTextColor="#ffd9bd"
                        style={styles.inputEdit}
                        autoCapitalize="none"
                        autoCorrect={false}
                        maxLength={24}
                      />
                      <TouchableOpacity onPress={handleSaveUsername} style={styles.btnIcon}>
                        <Ionicons name="checkmark" size={18} color="#2a1a0a" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleCancelEdit} style={styles.btnIcon}>
                        <Ionicons name="close" size={18} color="#2a1a0a" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setEditing(true)}
                      activeOpacity={0.8}
                      style={styles.chipInput}
                    >
                      <Text style={[styles.chipText, !username && styles.chipPlaceholder]}>
                        {username || 'nombre de usuario'}
                      </Text>
                    </TouchableOpacity>
                  )
                }
              />

              {/* plan → abre modal */}
              <ProfileRow
                icon="star-outline"
                label="plan"
                onPress={() => setPlansVisible(true)}
                right={
                  <TouchableOpacity
                    onPress={() => setPlansVisible(true)}
                    activeOpacity={0.85}
                    style={[
                      styles.chipPlan,
                      { backgroundColor: planChipColors(plan).bg },
                    ]}
                  >
                    {/* corona para VIP y también se muestra para los demás planes por consistencia */}
                    <MaterialCommunityIcons name="crown" size={16} color={planChipColors(plan).fg} />
                    <Text style={[styles.chipPlanText, { color: planChipColors(plan).fg }]}>{plan}</Text>
                  </TouchableOpacity>
                }
              />

              {/* tokens (balance MON) */}
              <ProfileRow
                icon="logo-bitcoin"
                label="tokens"
                right={
                  <View style={styles.chipInput}>
                    <Text style={styles.chipText}>{displayMON}</Text>
                  </View>
                }
              />
            </View>
          ) : (
            <View style={[styles.card, { alignItems: 'center' }]}>
              <AppKitButton label="Connect Wallet" />
              <Text style={styles.note}>Connect to see your profile</Text>
            </View>
          )}
        </View>

        {/* ====== MODAL PLANS (MISMO ARCHIVO) ====== */}
        <Modal
          visible={plansVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setPlansVisible(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setPlansVisible(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <ImageBackground
                source={require('@/assets/images/fondo.png')}
                resizeMode="cover"
                style={styles.modalBg}
                imageStyle={{ opacity: 0.12, borderRadius: 16 }}
              >
                {/* Top bar con título y cerrar */}
                <View style={styles.modalTop}>
                  <Text style={styles.plansTitle}>PLANS</Text>
                  <TouchableOpacity onPress={() => setPlansVisible(false)} style={styles.closeBtn}>
                    <Ionicons name="close" size={22} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* Lista de planes seleccionables */}
                <ScrollView
                  contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                  showsVerticalScrollIndicator={false}
                >
                  <PlanOption
                    title="Free"
                    selected={plan === 'Free'}
                    onSelect={selectPlan}
                    icon={<MaterialCommunityIcons name="star-four-points" size={44} color="#000" />}
                    bullets={[
                      'Limited access',
                      'Recommendations from unrecognized authors',
                      'Ads',
                    ]}
                  />
                  <PlanOption
                    title="Premium"
                    selected={plan === 'Premium'}
                    onSelect={selectPlan}
                    icon={<MaterialCommunityIcons name="diamond-stone" size={44} color="#000" />}
                    bullets={[
                      'New releases screen',
                      'More recommendations',
                      'Some +16 content',
                    ]}
                  />
                  <PlanOption
                    title="VIP"
                    selected={plan === 'VIP'}
                    onSelect={selectPlan}
                    icon={<MaterialCommunityIcons name="crown" size={44} color="#000" />}
                    bullets={[
                      'New releases with advance notice of date/time',
                      'Unlimited +16 content',
                      'Ad-free',
                    ]}
                  />
                </ScrollView>
              </ImageBackground>
            </Pressable>
          </Pressable>
        </Modal>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ========= Estilos ========= */
const ORANGE = '#ff8a2b';
const ORANGE_DARK = '#ef7f2a';
const CARD = '#ff7f3a';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  bg: { flex: 1 },
  bgImage: { opacity: 0.12 },

  header: {
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingTop: Platform.select({ ios: 6, android: 8 }),
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 90, maxWidth: '100%', resizeMode: 'contain', alignSelf: 'center' },
  headerRight: { position: 'absolute', right: 12, top: Platform.select({ ios: 6, android: 8 }), alignItems: 'flex-end' },
  addressTiny: { color: '#3b1f0e', fontSize: 12, marginBottom: 6, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#2a1a0a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  logoutLabel: { color: '#ffd36b', fontWeight: '800', fontSize: 12 },

  container: { flex: 1, paddingHorizontal: 18, paddingTop: 14 },

  userTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#1a1a1a',
    textShadowColor: 'rgba(255,200,60,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },

  avatar: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff22',
    marginTop: 8,
  },

  addrPill: {
    alignSelf: 'center',
    backgroundColor: '#111',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  addrPillText: { color: '#fff', fontWeight: '800', letterSpacing: 0.3 },

  card: {
    marginTop: 16,
    alignSelf: 'center',
    width: '92%',
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowLabel: { color: '#2a1a0a', fontWeight: '800', fontSize: 16, textTransform: 'lowercase' },

  chipInput: {
    backgroundColor: ORANGE_DARK,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 18,
    minWidth: 140,
    alignItems: 'center',
  },
  chipText: { color: '#ffd9bd', fontWeight: '800' },
  chipPlaceholder: { fontStyle: 'italic', opacity: 0.85 },

  chipPlan: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipPlanText: { fontWeight: '900' },

  editWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE_DARK,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  inputEdit: {
    color: '#ffd9bd',
    fontWeight: '800',
    minWidth: 140,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
  },
  btnIcon: {
    marginLeft: 6,
    backgroundColor: '#ffc94d',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },

  note: { color: '#3b1f0e', marginTop: 8, fontWeight: '600' },

  /* ===== Modal styles ===== */
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1f1f1f',
    maxHeight: '88%',
  },
  modalBg: { width: '100%', height: '100%' },
  modalTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  plansTitle: {
    fontSize: 44,
    fontWeight: '900',
    color: '#111',
    textShadowColor: 'rgba(255,200,60,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  closeBtn: {
    backgroundColor: ORANGE,
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 42,
  },
  bigIcon: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: ORANGE,
    borderWidth: 3.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 18,
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    right: -6,
    top: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#13c000',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0a0a0a',
  },
  planTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 8,
  },
  bullet: { color: '#eee', fontSize: 15, marginBottom: 6 },
});
