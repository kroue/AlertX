import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './firebase-config';

export default function MobileLoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleClearFields = () => {
    setUsername('');
    setPassword('');
    setErrors({ username: '', password: '' });
  };

  const validateForm = () => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'Username is required';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = () => {
    if (!validateForm()) return;
    setIsLoading(true);
    (async () => {
      try {
        const uname = username.trim();
        const pwd = password.trim();

        // Fetch the user document by username (documentId = username)
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/mobileUsers/${encodeURIComponent(uname)}?key=${firebaseConfig.apiKey}`;
        // add a timeout so slow networks fail fast and user isn't stuck waiting
        const controller = new AbortController();
        const TIMEOUT_MS = 8000; // 8 seconds
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let res;
        try {
          res = await fetch(url, { signal: controller.signal });
        } catch (fetchErr) {
          if (fetchErr.name === 'AbortError') {
            alert('Login timed out. Check your network connection and try again.');
            return;
          }
          throw fetchErr;
        } finally {
          clearTimeout(timeout);
        }
        if (!res.ok) {
          // more specific message for not found vs network
          if (res.status === 404) {
            // user document not found
            alert('Invalid username or password');
            return;
          }
          const text = await res.text();
          console.error('Login fetch failed', res.status, text);
          throw new Error('Invalid username or network error');
        }
        const doc = await res.json();
        // debug: log the returned document when password mismatch occurs
        // eslint-disable-next-line no-console
        console.log('Login fetched doc:', doc);

        const storedPw = doc.fields?.password?.stringValue;
        if (!storedPw) {
          console.error('No password field on user document', doc);
          alert('Account found but no password is set. Contact admin.');
          return;
        }

        // compare trimmed values to avoid stray whitespace mismatches
        if (storedPw.trim() !== pwd) {
          // helpful console output for debugging (do NOT keep in production)
          console.error('Password mismatch', { stored: storedPw, entered: pwd });
          alert('Invalid username or password');
          return;
        }

        // Save a simple session (profile) in AsyncStorage
        const profile = {
          username: uname,
          firstName: doc.fields?.firstName?.stringValue || '',
          lastName: doc.fields?.lastName?.stringValue || '',
          email: doc.fields?.email?.stringValue || '',
          phone: doc.fields?.contactNumber?.stringValue || '',
          address: doc.fields?.address?.stringValue || '',
          zone: doc.fields?.zone?.stringValue || '',
          emergencyContact: doc.fields?.emergencyContact?.stringValue || ''
        };
        await AsyncStorage.setItem('mobileUser', JSON.stringify(profile));

        // navigate to Home
        if (navigation && navigation.replace) navigation.replace('Home');
      } catch (err) {
        console.error('Login error', err);
        alert('Failed to login. Check your credentials or try again later.');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}>
              <Image source={require('./assets/shs_logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
            <View style={styles.separator} />
            <View style={styles.logoBox}>
              <Image source={require('./assets/alertx_logo.png')} style={styles.logoImage} resizeMode="contain" />
            </View>
          </View>
          <Text style={styles.welcomeTitle}>Welcome to AlertX</Text>
          <Text style={styles.welcomeSubtitle}>Senior High School Emergency System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(t) => {
                setUsername(t);
                if (errors.username) setErrors({ ...errors, username: '' });
              }}
              placeholder="Enter your username"
              style={[styles.input, errors.username ? styles.inputError : null]}
              returnKeyType="next"
              onSubmitEditing={() => { /* focus next if desired */ }}
              autoCapitalize="none"
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
            <View>
              <TextInput
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors({ ...errors, password: '' });
                }}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                style={[styles.input, errors.password ? styles.inputError : null]}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showButton}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Text style={styles.showButtonText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

            <TouchableOpacity style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={handleClearFields}>
              <Text style={styles.clearButtonText}>Clear Fields</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>New to AlertX?</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.signupButton} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupText}>Create an account</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2024 Senior High School & AlertX</Text>
            <Text style={styles.footerSmall}>All rights reserved</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 20, backgroundColor: '#3B82F6', flexGrow: 1 },
  header: { paddingTop: 40, paddingBottom: 16, alignItems: 'center' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  logoImage: { width: 72, height: 72, borderRadius: 16 },
  separator: { width: 1, height: 64, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  welcomeTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 8 },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  card: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  cardSubtitle: { color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 12 },
  form: { marginTop: 8 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    fontSize: 16,
  },
  inputError: { borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', marginTop: 6 },
  showButton: { position: 'absolute', right: 8, top: 12, padding: 6 },
  showButtonText: { fontSize: 18 },
  forgotButton: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: '#2563EB', fontWeight: '600' },
  loginButton: {
    marginTop: 14,
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontWeight: '700' },
  clearButton: { marginTop: 10, paddingVertical: 12, alignItems: 'center', borderRadius: 12, backgroundColor: '#F3F4F6' },
  clearButtonText: { color: '#374151', fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { marginHorizontal: 12, color: '#6B7280' },
  signupButton: { alignItems: 'center', marginTop: 12 },
  signupText: { color: '#2563EB', fontWeight: '600' },
  footer: { marginTop: 18, alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 12 },
  footerSmall: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});
