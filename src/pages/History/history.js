import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar'; // 引入Sidebar组件
import sampleCharacters from '../sampleCharacter.js'; // 引入sampleCharacters数据
import { FaRegClock } from 'react-icons/fa'; // 引入react-icons中的图标
import './history.css';

const History = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null); // 当前选中的角色
  const [searchTerm, setSearchTerm] = useState(''); // 搜索关键词
  const [filteredCharacters, setFilteredCharacters] = useState(sampleCharacters); // 过滤后的角色列表

  useEffect(() => {
    // 检查 sessionStorage 中是否有 'historyPageRefreshed' 标志
    const hasRefreshed = sessionStorage.getItem('historyPageRefreshed');
    if (!hasRefreshed || hasRefreshed === 'false') {
      // 如果没有刷新过，刷新页面并设置标志
      sessionStorage.setItem('historyPageRefreshed', 'true');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // 根据搜索关键词过滤角色列表
    const results = sampleCharacters.filter(character =>
      character.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCharacters(results);
  }, [searchTerm]);

  // 点击人物，更新选中的角色
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
  };

  return (
    <div className="history-container">
      <Sidebar />
      <div className="main-content">
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索角色..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="content-columns">
          <div className="character-selection">
            {filteredCharacters.map((character, index) => (
              <div
                key={index}
                className={`character-card ${selectedCharacter?.name === character.name ? 'selected' : ''}`}
                onClick={() => handleCharacterClick(character)}
              >
                <h3>{character.name}</h3>
              </div>
            ))}
          </div>
          {selectedCharacter && (
            <div className="selected-character">
              <h2>{selectedCharacter.name} 的时间轴</h2>
              <div className="timeline-container">
                <div className="timeline">
                  <div className="vertical-line"></div>
                  {selectedCharacter.history.map((event, index) => (
                    <div key={index} className="timeline-event">
                      <FaRegClock className="timeline-icon" />
                      <div className="timeline-date">{event.time}</div>
                      <div className="timeline-content">
                        <p>{event.event}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
