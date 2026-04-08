import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff } from 'lucide-react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

// THEME CONSTANTS - High Contrast / Modern
const C = {
  bgDark: '#0B0B0B',
  bgLight: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textMuted: '#9E9E9E',
  border: '#EEEEEE',
  accent: '#000000',
  inputBg: '#FCFCFC',
};

const HERO_HEIGHT = 260;

// Clean, geometric pattern for the header
function BackgroundPattern() {
  const TILE = 50;
  const cols = Math.ceil(SW / TILE) + 1;
  const rows = 6;

  const shapes = useMemo(() => {
    const items = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * TILE;
        const y = r * TILE;
        const type = (r + c) % 4;
        if (type === 0) {
          items.push(<Circle key={`${r}-${c}`} cx={x + 25} cy={y + 25} r="18" fill="#1A1A1A" fillOpacity="0.4" />);
        } else if (type === 1) {
          items.push(<Path key={`${r}-${c}`} d={`M${x+5} ${y+5} Q${x+25} ${y+45} ${x+45} ${y+5}`} stroke="#1A1A1A" strokeWidth="2" fill="none" opacity="0.3" />);
        }
      }
    }
    return items;
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width={SW} height={HERO_HEIGHT}>{shapes}</Svg>
    </View>
  );
}

export default function LoginScreen() {
  const [showPass, setShowPass] = useState(false);

  return (
    <SafeAreaView style={s.container} edges={['bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={s.scrollContent}
          bounces={false}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER SECTION */}
          <View style={s.header}>
            <BackgroundPattern />
            
            {/* LOGO - Centered in the dark area */}
            <View style={s.logoContainer}>
              <View style={s.logoBox}>
                <Svg width={44} height={44} viewBox="0 0 88 88">
                  {/* Dark background square */}
                  <Rect width="88" height="88" rx="20" fill="#0A2540" />
                  {/* Top arc — cyan */}
                  <Path
                    d="M22 44C22 31.85 31.85 22 44 22C56.15 22 66 31.85 66 44"
                    stroke="#00D4FF" strokeWidth="6.5" strokeLinecap="round"
                    fill="none"
                  />
                  {/* Bottom arc — white */}
                  <Path
                    d="M22 44C22 56.15 31.85 66 44 66H66"
                    stroke="white" strokeWidth="6.5" strokeLinecap="round"
                    fill="none"
                  />
                  {/* Center dot — cyan */}
                  <Circle cx="44" cy="44" r="8" fill="#00D4FF" />
                </Svg>
              </View>
            </View>
          </View>

          {/* FORM SECTION - This provides the single big curve */}
          <View style={s.body}>
            <Text style={s.title}>Login</Text>
            <Text style={s.tagline}>Your business financial identity</Text>

            <View style={s.inputWrapper}>
              <Text style={s.label}>Email</Text>
              <TextInput 
                style={s.input}
                placeholder="vijaybhuva90@gmail.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={s.inputWrapper}>
              <Text style={s.label}>Password</Text>
              <View style={s.passwordRow}>
                <TextInput 
                  style={[s.input, { flex: 1, borderBottomWidth: 0, marginBottom: 0, backgroundColor: 'transparent' }]}
                  placeholder="••••••••"
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  {showPass ? <EyeOff size={18} color={C.textMuted} /> : <Eye size={18} color={C.textMuted} />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.loginBtn} activeOpacity={0.9}>
              <Text style={s.loginBtnText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity style={s.footerLink}>
              <Text style={s.footerText}>
                Don’t have any account? <Text style={s.signUpText}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bgLight,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: C.bgDark, // Header background color
  },
  header: {
    height: HERO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    zIndex: 10,
    marginTop: -20, // Adjust logo height relative to curve
  },
  logoBox: {
    width: 70,
    height: 70,
    backgroundColor: '#FFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft shadow to match wireframe depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  tagline: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: -32,
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  body: {
    flex: 1,
    backgroundColor: C.bgLight,
    borderTopLeftRadius: 100, // THE MAIN CURVE
    paddingHorizontal: 30,
    paddingTop: 50,
    paddingBottom: 40,
    marginTop: -40, // Pulls the white section up into the dark area
  },
  title: {
    fontSize: 32,
    fontWeight: '500',
    color: C.textPrimary,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: -0.5,
  },
  inputWrapper: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: C.inputBg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textPrimary,
    marginBottom: 2,
  },
  input: {
    fontSize: 15,
    color: C.textPrimary,
    height: 24,
    padding: 0,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeBtn: {
    paddingLeft: 10,
  },
  loginBtn: {
    backgroundColor: C.bgDark,
    height: 58,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLink: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: C.textMuted,
  },
  signUpText: {
    fontWeight: '700',
    color: C.textPrimary,
  },
});