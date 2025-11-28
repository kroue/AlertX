import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export default function SignupScreen({ navigation }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [zone, setZone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const clearFields = () => {
    setFirstName('');
    setLastName('');
    setUsername('');
    setEmail('');
    setContactNumber('');
    setZone('');
    setAddress('');
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!username.trim()) e.username = 'Username is required';
    if (!email.trim()) e.email = 'Email is required';
    else {
      const re = /^\S+@\S+\.\S+$/;
      if (!re.test(email)) e.email = 'Email is invalid';
    }
    if (!contactNumber.trim()) e.contactNumber = 'Contact number is required';
    else if (!/^\+?[0-9\s-]{6,20}$/.test(contactNumber)) e.contactNumber = 'Contact number looks invalid';
    if (!zone.trim()) e.zone = 'Zone is required';
    if (!address.trim()) e.address = 'Address is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = () => {
    if (!validate()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      console.log('Signup data:', { firstName, lastName, username, email, contactNumber, zone, address });
      // Here you'd call your API to register the user
      // After successful signup, navigate back to Login
      if (navigation && navigation.navigate) navigation.navigate('Login');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoBox}><Text style={styles.logoText}>S</Text></View>
            <View style={styles.separator} />
            <View style={styles.logoBox}><Text style={styles.logoText}>A</Text></View>
          </View>
          <Text style={styles.welcomeTitle}>Create an AlertX account</Text>
          <Text style={styles.welcomeSubtitle}>Register to access AlertX features</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign Up</Text>

          <View style={styles.form}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={(t) => { setFirstName(t); if (errors.firstName) setErrors({ ...errors, firstName: '' }); }}
              placeholder="First name"
              style={[styles.input, errors.firstName ? styles.inputError : null]}
              autoCapitalize="words"
            />
            {errors.firstName ? <Text style={styles.errorText}>{errors.firstName}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={(t) => { setLastName(t); if (errors.lastName) setErrors({ ...errors, lastName: '' }); }}
              placeholder="Last name"
              style={[styles.input, errors.lastName ? styles.inputError : null]}
              autoCapitalize="words"
            />
            {errors.lastName ? <Text style={styles.errorText}>{errors.lastName}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(t) => { setUsername(t); if (errors.username) setErrors({ ...errors, username: '' }); }}
              placeholder="Username"
              style={[styles.input, errors.username ? styles.inputError : null]}
              autoCapitalize="none"
            />
            {errors.username ? <Text style={styles.errorText}>{errors.username}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); if (errors.email) setErrors({ ...errors, email: '' }); }}
              placeholder="Email"
              style={[styles.input, errors.email ? styles.inputError : null]}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Contact Number</Text>
            <TextInput
              value={contactNumber}
              onChangeText={(t) => { setContactNumber(t); if (errors.contactNumber) setErrors({ ...errors, contactNumber: '' }); }}
              placeholder="Contact number"
              style={[styles.input, errors.contactNumber ? styles.inputError : null]}
              keyboardType="phone-pad"
            />
            {errors.contactNumber ? <Text style={styles.errorText}>{errors.contactNumber}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Zone</Text>
            <TextInput
              value={zone}
              onChangeText={(t) => { setZone(t); if (errors.zone) setErrors({ ...errors, zone: '' }); }}
              placeholder="Zone"
              style={[styles.input, errors.zone ? styles.inputError : null]}
            />
            {errors.zone ? <Text style={styles.errorText}>{errors.zone}</Text> : null}

            <Text style={[styles.label, { marginTop: 12 }]}>Address</Text>
            <TextInput
              value={address}
              onChangeText={(t) => { setAddress(t); if (errors.address) setErrors({ ...errors, address: '' }); }}
              placeholder="Address"
              style={[styles.input, styles.textarea, errors.address ? styles.inputError : null]}
              multiline
              numberOfLines={3}
            />
            {errors.address ? <Text style={styles.errorText}>{errors.address}</Text> : null}

            <TouchableOpacity
              style={[styles.loginButton, isLoading ? styles.loginButtonDisabled : null]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginButtonText}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.clearButton} onPress={clearFields}>
              <Text style={styles.clearButtonText}>Clear Fields</Text>
            </TouchableOpacity>
          </View>

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
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  separator: { width: 1, height: 48, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  welcomeTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 8 },
  welcomeSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13 },

  card: {
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 18,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1F2937', textAlign: 'center', marginBottom: 8 },
  form: { marginTop: 4 },
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
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  inputError: { borderColor: '#FCA5A5' },
  errorText: { color: '#DC2626', marginTop: 6 },
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
  footer: { marginTop: 18, alignItems: 'center' },
  footerText: { color: '#6B7280', fontSize: 12 },
  footerSmall: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
});
