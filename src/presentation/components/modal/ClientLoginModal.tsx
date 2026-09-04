'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAssessment, type AccountRole } from '../../context/AssessmentContext';
import {
  X,
  User,
  Building2,
  Landmark,
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  UserPlus,
  Phone,
  Briefcase,
  AlertCircle
} from 'lucide-react';

interface ClientLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientLoginModal: React.FC<ClientLoginModalProps> = ({ isOpen, onClose }) => {
  const { language, t } = useLanguage();
  const { loginWithUser, loginAsRole } = useAssessment();
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth Mode: 'login' or 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Form States
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<AccountRole>('Home Buyer');
  const [regOrganization, setRegOrganization] = useState('');

  // Status & Feedback States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const isEn = language === 'en';

  // Handle Real Login Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage(isEn ? 'Email address and password are required.' : 'Alamat email dan kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        setSuccessMsg(isEn ? `Welcome back, ${data.user.fullName || data.user.email}!` : `Selamat datang kembali, ${data.user.fullName || data.user.email}!`);
        setTimeout(() => {
          loginWithUser(data.user);
          setIsSubmitting(false);
          setSuccessMsg('');
          onClose();
        }, 700);
      } else {
        setErrorMessage(
          data.error || (isEn ? 'Invalid email or password. Please register if you do not have an account.' : 'Email atau kata sandi salah. Silakan daftar jika belum memiliki akun.')
        );
        setIsSubmitting(false);
      }
    } catch (err: any) {
      setErrorMessage(isEn ? 'Connection issue. Please try again in a moment.' : 'Terjadi kendala koneksi. Silakan coba beberapa saat lagi.');
      setIsSubmitting(false);
    }
  };

  // Handle Real Registration Submission
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName || !regEmail || !regPassword) {
      setErrorMessage(isEn ? 'Full name, email, and password are required.' : 'Nama lengkap, email, dan kata sandi wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: regFullName,
          email: regEmail,
          password: regPassword,
          phoneNumber: regPhone,
          role: regRole,
          organization: regOrganization
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || (isEn ? 'Registration failed. Please check your information.' : 'Pendaftaran gagal. Silakan periksa kembali data Anda.'));
        setIsSubmitting(false);
        return;
      }

      setSuccessMsg(isEn ? `Registration successful! Welcome to GoTangguh, ${data.user?.fullName || regFullName}!` : `Pendaftaran berhasil! Selamat datang di GoTangguh, ${data.user?.fullName || regFullName}!`);
      setTimeout(() => {
        if (data.user) {
          loginWithUser(data.user);
        } else {
          loginAsRole(regRole, regEmail);
        }
        setIsSubmitting(false);
        setSuccessMsg('');
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMessage(isEn ? 'Connection issue during registration. Please try again in a moment.' : 'Terjadi kendala koneksi saat mendaftarkan akun. Silakan coba beberapa saat lagi.');
      setIsSubmitting(false);
    }
  };

  if (!isMounted || !isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="gt-login-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="gt-login-modal-close"
          onClick={onClose}
          aria-label={isEn ? 'Close' : 'Tutup'}
        >
          <X size={18} />
        </button>

        {/* Header Branding */}
        <div className="gt-login-header">
          <div className="gt-login-brand">
            <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #c2410c, #ea580c)', color: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
              GT
            </div>
            <div className="gt-login-brand-name">
              <span className="gt-login-go">Go</span>
              <span className="gt-login-tangguh">Tangguh</span>
            </div>
          </div>
          <h3 className="gt-login-title">
            {authMode === 'login'
              ? (isEn ? 'User Sign In Portal' : 'Portal Masuk Pengguna')
              : (isEn ? 'Create New Account' : 'Daftar Akun Baru')}
          </h3>
          <p className="gt-login-subtitle">
            {authMode === 'login'
              ? (isEn ? 'Access spatial due diligence dashboards, Groundsure report archives, and hazard intelligence.' : 'Akses dashboard due diligence spasial, arsip Groundsure, dan pusat data bencana.')
              : (isEn ? 'Register your profile to secure your multi-hazard property due diligence history.' : 'Daftarkan profil Anda untuk mengamankan riwayat analisis risiko dan uji tuntas properti.')}
          </p>

          {/* Mode Switcher Tabs (Login vs Register) */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginTop: '14px', gap: '4px' }}>
            <button
              type="button"
              style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: authMode === 'login' ? '#ffffff' : 'transparent', color: authMode === 'login' ? '#0f172a' : '#64748b', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: authMode === 'login' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s' }}
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
              }}
            >
              {isEn ? 'Sign In' : 'Masuk ke Akun'}
            </button>
            <button
              type="button"
              style={{ flex: 1, padding: '8px', borderRadius: '7px', border: 'none', background: authMode === 'register' ? '#ffffff' : 'transparent', color: authMode === 'register' ? '#c2410c' : '#64748b', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', boxShadow: authMode === 'register' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
              }}
            >
              <UserPlus size={14} />
              <span>{isEn ? 'Register Account' : 'Daftar Akun Baru'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Notifications */}
        {errorMessage && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertCircle size={15} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <CheckCircle2 size={16} style={{ color: '#10b981' }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ===================================================================
            FORM 1: LOGIN MODE (Clean & Professional)
            =================================================================== */}
        {authMode === 'login' ? (
          <div>
            {/* Email & Password Form */}
            <form onSubmit={handleLoginSubmit}>
              <div className="gt-form-field" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Email Address' : 'Alamat Email'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px' }}>
                  <Mail size={14} style={{ color: '#94a3b8', marginRight: '8px' }} />
                  <input
                    type="email"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '9px 0', fontSize: '0.84rem', outline: 'none', color: '#0f172a' }}
                    placeholder={isEn ? 'name@company.com' : 'nama@domain.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gt-form-field" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Password' : 'Kata Sandi'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 12px' }}>
                  <Lock size={14} style={{ color: '#94a3b8', marginRight: '8px' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '9px 0', fontSize: '0.84rem', outline: 'none', color: '#0f172a' }}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', background: '#c2410c', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(194, 65, 12, 0.25)', transition: 'all 0.2s' }}
              >
                <span>{isSubmitting ? (isEn ? 'Signing in...' : 'Memverifikasi Akun...') : (isEn ? 'Sign In to Workspace' : 'Masuk ke Portal')}</span>
                <ArrowRight size={15} />
              </button>
            </form>
          </div>
        ) : (
          /* ===================================================================
              FORM 2: REGISTRATION MODE (USER SIGN UP TO MYSQL)
              =================================================================== */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="gt-form-field">
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Full Name *' : 'Nama Lengkap *'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}>
                  <User size={13} style={{ color: '#94a3b8', marginRight: '6px' }} />
                  <input
                    type="text"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 0', fontSize: '0.8rem', outline: 'none', color: '#0f172a' }}
                    placeholder={isEn ? 'John Doe' : 'Nama Lengkap'}
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gt-form-field">
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Phone / WhatsApp' : 'Nomor WhatsApp / HP'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}>
                  <Phone size={13} style={{ color: '#94a3b8', marginRight: '6px' }} />
                  <input
                    type="text"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 0', fontSize: '0.8rem', outline: 'none', color: '#0f172a' }}
                    placeholder="+62 812-xxxx"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <div className="gt-form-field">
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Email Address *' : 'Alamat Email *'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}>
                  <Mail size={13} style={{ color: '#94a3b8', marginRight: '6px' }} />
                  <input
                    type="email"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 0', fontSize: '0.8rem', outline: 'none', color: '#0f172a' }}
                    placeholder="email@domain.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="gt-form-field">
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Password *' : 'Kata Sandi *'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}>
                  <Lock size={13} style={{ color: '#94a3b8', marginRight: '6px' }} />
                  <input
                    type="password"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 0', fontSize: '0.8rem', outline: 'none', color: '#0f172a' }}
                    placeholder={isEn ? 'Min. 6 characters' : 'Minimal 6 karakter'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
              <div className="gt-form-field">
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Role / Perspective' : 'Profil / Sudut Pandang'}
                </label>
                <select
                  style={{ width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as AccountRole)}
                >
                  <option value="Home Buyer">{isEn ? 'Home Buyer / Individual' : 'Pencari Rumah Pribadi'}</option>
                  <option value="Property Developer">{isEn ? 'Property Developer (B2B)' : 'Property Developer (B2B)'}</option>
                  <option value="Lender / Bank">{isEn ? 'Lender / Bank Appraisal' : 'Lender / Bank Appraisal'}</option>
                  <option value="Consultant / Auditor">{isEn ? 'Consultant / ESG Auditor' : 'Consultant / ESG Auditor (RDI)'}</option>
                </select>
              </div>

              <div className="gt-form-field">
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  {isEn ? 'Company / Organization' : 'Nama Instansi / Perusahaan'}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px' }}>
                  <Briefcase size={13} style={{ color: '#94a3b8', marginRight: '6px' }} />
                  <input
                    type="text"
                    style={{ width: '100%', border: 'none', background: 'transparent', padding: '8px 0', fontSize: '0.8rem', outline: 'none', color: '#0f172a' }}
                    placeholder={isEn ? 'e.g. Individual / PT XYZ' : 'Contoh: Pribadi / PT XYZ'}
                    value={regOrganization}
                    onChange={(e) => setRegOrganization(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ width: '100%', background: 'linear-gradient(135deg, #c2410c, #ea580c)', color: '#ffffff', border: 'none', borderRadius: '8px', padding: '11px', fontWeight: 800, fontSize: '0.86rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(194, 65, 12, 0.25)', transition: 'all 0.2s' }}
            >
              <UserPlus size={15} />
              <span>{isSubmitting ? (isEn ? 'Creating account...' : 'Mendaftarkan Akun...') : (isEn ? 'Register New Account' : 'Daftarkan Akun Baru Sekarang')}</span>
            </button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ClientLoginModal;
