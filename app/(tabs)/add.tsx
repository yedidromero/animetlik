// app/(tabs)/add.tsx
import React, { useMemo, useState } from 'react';
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
  KeyboardAvoidingView,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
//import * as ImagePicker from 'expo-image-picker';
import { AppKitButton } from '@reown/appkit-wagmi-react-native';
import { useAccount, useDisconnect, useWalletClient } from 'wagmi';

/* ===== Header con tu logo (y acciones a la derecha si estás conectado) ===== */
function AppHeader({ right }: { right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <View style={styles.headerRight}>{right}</View>
    </View>
  );
}

export default function AddScreen() {
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // ===== Estado de wallet (igual patrón que profile.tsx) =====
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { disconnect } = useDisconnect();

  const isReadyConnected = useMemo(
    () => Boolean(isConnected && address && walletClient),
    [isConnected, address, walletClient]
  );

  // ===== Selección de portada =====
  const pickCover = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería para adjuntar la portada.');
        return;
      }
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 2],
      quality: 0.9,
    });

    if (!res.canceled && res.assets?.[0]?.uri) {
      setCoverUri(res.assets[0].uri);
    }
  };

  const clearCover = () => setCoverUri(null);

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Falta información', 'Completa el título y la historia.');
      return;
    }
    // TODO: lógica real de envío
    console.log('SUBMIT', { coverUri, title, body });
    Alert.alert('¡Guardado!', 'Tu historia se guardó (demo).');
    setCoverUri(null);
    setTitle('');
    setBody('');
  };

  const shortAddr = (addr?: string) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : '';

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('@/assets/images/fondo.png')}
        resizeMode="cover"
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        {/* Header con logo; a la derecha address y disconnect si hay conexión */}
        <AppHeader
          right={
            isReadyConnected ? (
              <>
                <Text style={styles.addressTiny}>{shortAddr(address!)}</Text>
                <TouchableOpacity onPress={() => disconnect()} style={styles.logoutBtn}>
                  <Text style={styles.logoutLabel}>Disconnect</Text>
                </TouchableOpacity>
              </>
            ) : null
          }
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Contenido: si NO hay wallet conectada, mostramos Connect Wallet */}
          {!isReadyConnected ? (
            <ScrollView
              contentContainerStyle={[styles.container, { alignItems: 'center' }]}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.cardLogin]}>
                <Text style={styles.loginTitle}>Log in / Sign up</Text>
                <AppKitButton label="Connect Wallet" />
                <Text style={styles.note}>Connect your wallet to create a new story.</Text>
              </View>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
              {/* ====== Tarjeta/Sección EDIT visible ====== */}
              <View style={styles.editorCard}>
                <Text style={styles.editTitle}>EDIT</Text>

                {/* Caja de portada */}
                <Pressable onPress={pickCover} style={styles.coverBox}>
                  {coverUri ? (
                    <>
                      <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
                      <TouchableOpacity onPress={clearCover} style={styles.clearBtn}>
                        <Ionicons name="close" size={16} color="#000" />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <Text style={styles.coverPlaceholder}>Adjuntar portada del capítulo.</Text>
                  )}
                </Pressable>

                {/* Título centrado y visible */}
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Title"
                  placeholderTextColor="#b9b9b9"
                  style={styles.storyTitle}
                  maxLength={70}
                  autoCorrect={false}
                  autoCapitalize="sentences"
                />

                {/* Cuerpo */}
                <TextInput
                  value={body}
                  onChangeText={setBody}
                  placeholder="Write your story here"
                  placeholderTextColor="#cfcfcf"
                  style={styles.storyBody}
                  multiline
                  textAlignVertical="top"
                  autoCorrect
                />
              </View>

              {/* separador para no tapar con FAB */}
              <View style={{ height: 110 }} />
            </ScrollView>
          )}

          {/* Botón flotante naranja con check (solo útil si conectado) */}
          {isReadyConnected && (
            <TouchableOpacity onPress={submit} activeOpacity={0.9} style={styles.fab}>
              <Ionicons name="checkmark" size={32} color="#000" />
            </TouchableOpacity>
          )}
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
}

/* ===== Estilos ===== */
const ORANGE = '#ff8a2b';
const CARD = '#ff7f3a';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#121212' },
  bg: { flex: 1 },
  bgImage: { opacity: 0.12 },

  /* Header */
  header: {
    backgroundColor: ORANGE,
    paddingHorizontal: 14,
    paddingTop: Platform.select({ ios: 6, android: 8 }),
    paddingBottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 90, maxWidth: '100%', resizeMode: 'contain', alignSelf: 'center' },
  headerRight: {
    position: 'absolute',
    right: 12,
    top: Platform.select({ ios: 6, android: 8 }),
    alignItems: 'flex-end',
  },
  addressTiny: { color: '#3b1f0e', fontSize: 12, marginBottom: 6, fontWeight: '700' },
  logoutBtn: { backgroundColor: '#2a1a0a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  logoutLabel: { color: '#ffd36b', fontWeight: '800', fontSize: 12 },

  /* Contenido */
  container: { paddingHorizontal: 18, paddingTop: 14 },

  /* Tarjeta de acceso cuando NO hay conexión */
  cardLogin: {
    marginTop: 24,
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
  loginTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(255,200,60,0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  note: { color: '#3b1f0e', marginTop: 8, fontWeight: '600', textAlign: 'center' },

  /* ===== Sección/ Tarjeta EDIT (más visible) ===== */
  editorCard: {
    backgroundColor: 'rgba(0,0,0,0.45)', // capa para separarse del fondo
    borderWidth: 2,
    borderColor: '#0f0f0f',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },

  editTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#f2f2f2',
    textShadowColor: 'rgba(255,200,60,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    marginBottom: 10,
  },

  coverBox: {
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff14',
    overflow: 'hidden',
  },
  coverPlaceholder: { color: '#d0d0d0', fontSize: 12, textAlign: 'center', paddingHorizontal: 10 },
  coverImage: { width: '100%', height: '100%' },
  clearBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },

  storyTitle: {
    marginTop: 14,
    fontSize: 28,
    textAlign: 'center',     // centrado
    color: '#f2f2f2',        // texto claro
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', // contraste leve
  },

  storyBody: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#1a1a1a',
    borderRadius: 8,
    minHeight: 220,
    padding: 12,
    fontSize: 15,
    color: '#f5f5f5',
    backgroundColor: '#00000055',
  },

  /* Botón flotante para guardar */
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 18,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 2,
    borderColor: '#000',
  },
});
