import React from 'react';
import { Link } from 'react-router-dom';
import { Panel } from 'rsuite';
import { CgShield } from 'react-icons/cg';
import { useLanguage } from '../hooks/useLanguage';
import PageHeader from '../components/PageHeader';
import './Settings.css';

const LAST_UPDATED = '2025-02-20';

function PrivacyPolicy() {
  const { t } = useLanguage();

  const sections = [
    { titleKey: null, contentKey: 'privacyIntro' },
    { titleKey: 'privacyDataWeCollectTitle', contentKey: 'privacyDataWeCollect' },
    { titleKey: 'privacySyncTitle', contentKey: 'privacySync' },
    { titleKey: 'privacyCookiesTitle', contentKey: 'privacyCookies' },
    { titleKey: 'privacyRightsTitle', contentKey: 'privacyRights' },
    { titleKey: 'privacyContactTitle', contentKey: 'privacyContact' }
  ];

  return (
    <div className="settings-page">
      <PageHeader
        icon={<CgShield />}
        title={t('privacyPageTitle')}
        subtitle={`${t('privacyPageLastUpdated')}: ${LAST_UPDATED}`}
      />

      {sections.map(({ titleKey, contentKey }, i) => (
        <Panel key={i} className="glass-card" style={{ marginBottom: '20px' }}>
          {titleKey && (
            <h2 style={{
              marginBottom: '12px',
              color: 'var(--text-primary)',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {t(titleKey)}
            </h2>
          )}
          <p style={{
            margin: 0,
            lineHeight: '1.8',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line'
          }}>
            {t(contentKey)}
          </p>
        </Panel>
      ))}

      <p style={{ textAlign: 'center', marginTop: '24px' }}>
        <Link
          to="/settings"
          style={{ color: 'var(--accent-safe)', textDecoration: 'none' }}
        >
          ← {t('navSettings')}
        </Link>
      </p>
    </div>
  );
}

export default PrivacyPolicy;
