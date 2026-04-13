import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { inviteApi } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(!!inviteToken);
  const [inviteData, setInviteData] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (inviteToken) {
      validateInvite(inviteToken);
    }
  }, [inviteToken]);

  const validateInvite = async (token) => {
    try {
      setValidating(true);
      const response = await inviteApi.validate(token);
      setInviteData(response.data.data);
      setFormData(prev => ({ ...prev, email: response.data.data.email }));
    } catch (error) {
      setInviteError(error.response?.data?.message || 'Invalid or expired invite');
    } finally {
      setValidating(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (inviteToken) {
        await inviteApi.acceptInvite(inviteToken, formData);
        toast.success('Registration successful! You can now login.');
        navigate('/login');
      } else {
        await register(formData);
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (validating) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p>Validating invite...</p>
          </div>
        </div>
      </div>
    );
  }

  if (inviteError) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.errorState}>
            <div style={styles.errorIcon}>!</div>
            <h2 style={styles.errorTitle}>Invalid Invite</h2>
            <p style={styles.errorMessage}>{inviteError}</p>
            <Link to="/register" style={styles.link}>Register as Business Owner</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>W</span>
          </div>
          
          {inviteToken && inviteData ? (
            <>
              <h1 style={styles.title}>Join Team</h1>
              <p style={styles.subtitle}>
                You've been invited to join <strong>{inviteData.businessName}</strong>
              </p>
              <div style={styles.inviteInfo}>
                <p>Invited by: {inviteData.invitedBy}</p>
                <p>Role: <span style={styles.roleBadge}>{inviteData.role}</span></p>
              </div>
            </>
          ) : (
            <>
              <h1 style={styles.title}>Create Account</h1>
              <p style={styles.subtitle}>Get started with WhatsApp AI</p>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="John"
                style={styles.input}
                required
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Doe"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john@example.com"
              style={styles.input}
              required
              disabled={!!inviteToken}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
              style={styles.input}
              required
              minLength={6}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Creating account...' : inviteToken ? 'Join Team' : 'Create Account'}
          </button>
        </form>

        {!inviteToken && (
          <p style={styles.footer}>
            Already have an account? <Link to="/login" style={styles.link}>Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: '20px'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  logo: {
    marginBottom: '16px'
  },
  logoIcon: {
    display: 'inline-flex',
    width: '60px',
    height: '60px',
    backgroundColor: '#2563eb',
    borderRadius: '16px',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '28px',
    color: '#fff'
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b'
  },
  inviteInfo: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f0fdf4',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#166534'
  },
  roleBadge: {
    padding: '2px 8px',
    backgroundColor: '#dcfce7',
    borderRadius: '4px',
    textTransform: 'capitalize'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  row: {
    display: 'flex',
    gap: '16px'
  },
  inputGroup: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  button: {
    padding: '14px',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#64748b'
  },
  link: {
    color: '#2563eb',
    textDecoration: 'none',
    fontWeight: '500'
  },
  loadingState: {
    textAlign: 'center',
    padding: '40px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  errorState: {
    textAlign: 'center',
    padding: '40px'
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    backgroundColor: '#fef2f2',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    color: '#dc2626',
    margin: '0 auto 16px'
  },
  errorTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: '8px'
  },
  errorMessage: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '24px'
  }
};

export default Register;
