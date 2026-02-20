import React from 'react';

function PageHeader({ icon, title, subtitle }) {
    return (
        <div className="page-header">
            {React.cloneElement(icon, {
                className: 'icon-glow',
                style: { fontSize: '48px', marginBottom: '20px', color: 'var(--text-primary)' }
            })}
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
        </div>
    );
}

export default PageHeader;
