import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import './history.css';

const VerticalTimeline = ({ history }) => {
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div className="vertical-timeline-container">
      <svg className="vertical-timeline-curve" width="60" height={history.length * 120} style={{ position: 'absolute', left: 30, top: 0, zIndex: 0 }}>
        <path d={
          history.map((_, i) => `M30,${i * 120 + 30} Q60,${i * 120 + 60} 30,${(i + 1) * 120 + 30}`).join(' ')
        } stroke="#1890ff" strokeWidth="4" fill="none" />
      </svg>
      <div className="vertical-timeline-events" style={{ position: 'relative', zIndex: 2 }}>
        {history.map((event, idx) => (
          <div key={idx} className="vertical-timeline-event" style={{
            position: 'relative',
            left: 0,
            marginBottom: 40,
            background: 'linear-gradient(120deg,#e6f7ff 0%,#fff 100%)',
            borderRadius: 14,
            boxShadow: '0 2px 8px #1890ff22',
            padding: '16px 18px',
            minWidth: 220,
            maxWidth: 320,
            cursor: 'pointer',
            transition: 'box-shadow 0.2s',
          }} onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 600, color: '#1890ff', fontSize: 16 }}>{event.time}</span>
                <span style={{ fontSize: 15, color: '#333', marginLeft: 10 }}>{event.event}</span>
              </div>
              <span>{expandedIdx === idx ? <FaChevronUp /> : <FaChevronDown />}</span>
            </div>
            {expandedIdx === idx && (
              <div className="vertical-timeline-details" style={{ marginTop: 10, fontSize: 14, color: '#444' }}>
                {Object.entries(event).map(([key, value]) => (
                  key !== 'time' && key !== 'event' && value ? (
                    <div key={key} style={{ marginBottom: 6 }}>
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

export default VerticalTimeline;
