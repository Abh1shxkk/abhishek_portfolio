import React from 'react';

/** A flat, CSS-only version of the countryside for the inner pages: sky, sun, hills and a road. */
export const PageSky: React.FC = () => (
  <div className="page-sky" aria-hidden="true">
    <div className="sun" />
    <div className="cloud" style={{ top: '12%', left: '-10%', '--dur': '140s' } as React.CSSProperties} />
    <div className="cloud" style={{ top: '22%', left: '30%', '--dur': '170s', transform: 'scale(0.7)' } as React.CSSProperties} />
    <div className="cloud" style={{ top: '8%', left: '62%', '--dur': '120s', transform: 'scale(0.85)' } as React.CSSProperties} />
    <div className="hill hill-far" />
    <div className="hill hill-mid" />
    <div className="hill hill-near" />
    <div className="road" />
  </div>
);
