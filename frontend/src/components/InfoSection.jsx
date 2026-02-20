import React from 'react';
import { Panel } from 'rsuite';

function InfoSection({ title, items, isWarning = false, warningMessage }) {
    const panelClassName = isWarning ? 'glass-card warning-panel' : 'glass-card';
    const titleColor = isWarning ? 'var(--warning)' : 'var(--text-primary)';

    return (
        <Panel className={panelClassName} style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', fontSize: '18px', fontWeight: 'bold', color: titleColor }}>
                {title}
            </h3>

            {warningMessage && (
                <div style={{
                    marginBottom: '15px',
                    padding: '15px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--warning)'
                }}>
                    <div style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
                        <strong style={{ color: 'var(--warning)' }}>{warningMessage.title}</strong>
                        {'\n'}
                        {warningMessage.content}
                    </div>
                </div>
            )}

            <div style={{ color: 'var(--text-primary)' }}>
                {items.map((item, index) => (
                    <div
                        key={index}
                        style={{
                            padding: '8px 0',
                            borderBottom: index < items.length - 1 ? '1px solid var(--glass-border)' : 'none'
                        }}
                    >
                        {item.label ? (
                            <>
                                <strong style={{ color: 'var(--text-primary)' }}>{item.label}:</strong>
                                {item.content}
                            </>
                        ) : (
                            <span style={{ lineHeight: '1.6' }}>{item.content}</span>
                        )}
                    </div>
                ))}
            </div>
        </Panel>
    );
}

export default InfoSection;
