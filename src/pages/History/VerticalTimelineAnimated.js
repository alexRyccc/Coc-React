import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './history.css';

const curveHeight = 100;
const curveWidth = 60;

const VerticalTimelineAnimated = ({ history }) => {
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div className="vertical-timeline-animated-container">
      <svg className="vertical-timeline-animated-curve" width={curveWidth} height={history.length * curveHeight + 60} style={{ position: 'absolute', left: 30, top: 0, zIndex: 0 }}>
        <path
          d={
            history.length > 0
              ? `M30,30 ${history.map((_, i) => `Q60,${i * curveHeight + 60} 30,${(i + 1) * curveHeight + 30}`).join(' ')}`
              : ''
          }
          stroke="#1890ff"
          strokeWidth="5"
          fill="none"
          style={{
            strokeDasharray: 2000,
            strokeDashoffset: 0,
            animation: 'timeline-flow 2.5s cubic-bezier(.77,0,.18,1) forwards',
          }}
        />
      </svg>
      <div className="vertical-timeline-animated-events" style={{ position: 'relative', zIndex: 2 }}>
        {history.map((event, idx) => (
          <div
            key={idx}
            className={`vertical-timeline-animated-event${expandedIdx === idx ? ' expanded' : ''}`}
            style={{
              position: 'relative',
              left: 0,
              marginBottom: 40,
              background: 'linear-gradient(120deg,#e6f7ff 0%,#fff 100%)',
              borderRadius: 18,
              boxShadow: '0 4px 24px #1890ff22',
              padding: '18px 22px',
              minWidth: 220,
              maxWidth: 340,
              cursor: 'pointer',
              transition: 'box-shadow 0.3s, transform 0.3s',
              animation: `event-fade-in 0.7s ${0.2 * idx}s both`,
              transform: expandedIdx === idx ? 'scale(1.04)' : 'scale(1)',
            }}
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#1890ff', fontSize: 17 }}>{event.time}</span>
                <span style={{ fontSize: 16, color: '#333', marginLeft: 12 }}>{event.event}</span>
              </div>
              <span>{expandedIdx === idx ? <FaChevronUp /> : <FaChevronDown />}</span>
            </div>
            <div className="timeline-dot-animated" style={{ left: -38, top: 18, position: 'absolute', width: 22, height: 22, background: 'linear-gradient(135deg,#1890ff 0%,#40a9ff 100%)', borderRadius: '50%', boxShadow: '0 2px 12px #1890ff44', border: '3px solid #fff', animation: 'dot-bounce 1.2s infinite alternate' }} />
            {expandedIdx === idx && (
              <div className="vertical-timeline-animated-details" style={{ marginTop: 12, fontSize: 15, color: '#444', background: '#f6fbff', borderRadius: 10, padding: '10px 12px', boxShadow: '0 2px 8px #1890ff22', animation: 'details-expand 0.5s cubic-bezier(.77,0,.18,1) both' }}>
                {Object.entries(event).map(([key, value]) => (
                  key !== 'time' && key !== 'event' && value ? (
                    <div key={key} style={{ marginBottom: 7 }}>
                      <strong style={{ color: '#1890ff' }}>{key}:</strong> {value}
                    </div>
                  ) : null
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VerticalTimelineAnimated;
