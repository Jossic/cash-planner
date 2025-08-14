import type { Config } from 'tailwindcss';

/**
 * JLA CASH PLANNER TAILWIND CONFIG
 * Professional Financial App Design System
 * Dark Theme with nuanced backgrounds and business colors
 */

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,css,md,mdx,html,json,scss}',
  ],
  darkMode: 'class',
  important: true,
  theme: {
    extend: {
      colors: {
        // ===========================
        // SLATE BACKGROUNDS
        // Nuanced dark theme based on slate rather than pure black
        // ===========================
        slate: {
          950: '#0f0f23',  // Primary background - Deep navy slate
          900: '#1a1a2e',  // Secondary background - Sidebar
          850: '#232347',  // Elevated surfaces - Cards
          800: '#2d2d54',  // Interactive surfaces - Hover states
          700: '#404071',  // Borders and dividers
          600: '#52538f',  // Subtle accents
          500: '#64748b',  // Medium
          400: '#94a3b8',  // Light slate
          300: '#cbd5e1',  // Lighter slate
          200: '#e2e8f0',  // Very light
          100: '#f1f5f9',  // Near white
          50: '#f8fafc',   // Almost white
        },
        
        // ===========================
        // BUSINESS COLORS
        // Professional financial app palette
        // ===========================
        
        // Revenue Green - Success, Income, Positive metrics
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',   // Main revenue green
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        
        // VAT Orange - Warnings, Tax-related items
        orange: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',   // Main VAT orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        
        // Professional Blue - URSSAF, Primary actions
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',   // Main professional blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        
        // Danger Red - Errors, Debts, Negative metrics
        red: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',   // Main error red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        
        // Purple - Secondary metrics, Special highlights
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8b5cf6',   // Main accent purple
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#581c87',
          950: '#2e1065',
        },
        
        // ===========================
        // LEGACY COMPATIBILITY
        // Keep some aliases for existing code
        // ===========================
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdf4', 
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          900: '#064e3b',
        },
        
        // Deprecated - will be removed in future versions
        dark: {
          50: '#f1f5f9',   // Map to text colors
          100: '#cbd5e1',
          200: '#94a3b8', 
          300: '#64748b',
          400: '#475569',
          500: '#334155',
          600: '#52538f',  // Map to slate-600
          700: '#404071',  // Map to slate-700
          800: '#2d2d54',  // Map to slate-800 
          850: '#232347',  // Map to slate-850
          900: '#1a1a2e',  // Map to slate-900
          950: '#0f0f23',  // Map to slate-950
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Consolas', 'Courier New', 'monospace'],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        
        // Custom typography scale
        'display': ['2.25rem', { lineHeight: '2.75rem', fontWeight: '700' }],
        'heading': ['1.5rem', { lineHeight: '2rem', fontWeight: '600' }],
        'subheading': ['1.125rem', { lineHeight: '1.75rem', fontWeight: '500' }],
        'body': ['0.875rem', { lineHeight: '1.5rem' }],
        'small': ['0.8125rem', { lineHeight: '1.25rem' }],
      },
      spacing: {
        // Enhanced spacing scale
        '18': '4.5rem',
        '88': '22rem', 
        '112': '28rem',
        '128': '32rem',
        
        // Design system spacing tokens
        'xs': '4px',
        'sm': '8px', 
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      borderRadius: {
        'sm': '6px',
        DEFAULT: '8px',
        'md': '8px', 
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'floating': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 2s infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;