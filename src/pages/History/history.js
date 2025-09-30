import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Sidebar from '../Sidebar'; // 引入Sidebar组件
import './history.css';
import VerticalTimelineAnimated from './VerticalTimelineAnimated';

const History = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null); // 当前选中的角色
  const [searchTerm, setSearchTerm] = useState(''); // 搜索关键词
  const [filteredCharacters, setFilteredCharacters] = useState([]); // 过滤后的角色列表
  
  // 从 Redux store 中获取角色数据，类似 home.js 的实现
  const rawCharacters = useSelector(state => state.characters || []);
  const user = useSelector(state => state.user);
  const dispatch = useDispatch();
  
  console.log('History - User state:', user);
  console.log('History - Raw characters:', rawCharacters);
  
  // 使用 useMemo 来避免每次渲染都重新计算 characters
  const characters = useMemo(() => {
    // 自动转换为sampleCharacters格式
    function convertToSampleCharacter(apiCharacter) {
      // 转换 skills 字段
      const skills = {};
      if (apiCharacter.skills) {
        Object.entries(apiCharacter.skills).forEach(([key, value]) => {
          if (typeof value === 'number') {
            skills[key] = { initial: value, current: value };
          }
        });
      }
      return {
        ...apiCharacter,
        skills,
        int: apiCharacter.int_ ?? apiCharacter.int,
      };
    }
    
    return Array.isArray(rawCharacters)
      ? rawCharacters.map(convertToSampleCharacter)
      : rawCharacters ? [convertToSampleCharacter(rawCharacters)] : [];
  }, [rawCharacters]);

  useEffect(() => {
    // 只有在用户已登录时才获取角色
    if (user) {
      console.log('History - User logged in, fetching characters');
      dispatch({ type: 'FETCH_CHARACTERS' });
    } else {
      console.log('History - User not logged in');
    }
  }, [dispatch, user]);

  useEffect(() => {
    // 移除页面刷新逻辑，因为它会导致状态丢失
    // 检查 sessionStorage 中是否有 'historyPageRefreshed' 标志
    // const hasRefreshed = sessionStorage.getItem('historyPageRefreshed');
    // if (!hasRefreshed || hasRefreshed === 'false') {
    //   // 如果没有刷新过，刷新页面并设置标志
    //   sessionStorage.setItem('historyPageRefreshed', 'true');
    //   window.location.reload();
    // }
  }, []);

  useEffect(() => {
    // 根据搜索关键词过滤角色列表
    const results = characters.filter(character =>
      character.name && character.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCharacters(results);
  }, [searchTerm, characters]);

  // 点击人物，更新选中的角色
  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
  };

  // 分组和标签示例（可根据实际数据扩展）
  const groupEvents = (history) => {
    // 按年份分组
    const groups = {};
    history.forEach(event => {
      const year = event.time.split('-')[0];
      if (!groups[year]) groups[year] = [];
      groups[year].push(event);
    });
    return groups;
  };

  return (
    <div className="history-container">
      <Sidebar />
      <div className="main-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 8px', boxSizing: 'border-box' }}>
        <div className="search-bar" style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <input
            type="text"
            placeholder="搜索角色..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              maxWidth: 400,
              padding: '12px 18px',
              fontSize: 17,
              borderRadius: 12,
              border: '1.5px solid #1890ff',
              boxShadow: '0 2px 12px #1890ff22',
              outline: 'none',
              transition: 'border 0.2s',
            }}
          />
        </div>
        <div className="content-columns" style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center', alignItems: 'flex-start' }}>
          <div className="character-selection" style={{ minWidth: 180, flex: '0 0 220px', background: 'rgba(255,255,255,0.85)', borderRadius: 18, boxShadow: '0 2px 16px #1890ff11', padding: 12, marginBottom: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1890ff', marginBottom: 12, textAlign: 'center' }}>角色列表</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredCharacters.map((character, index) => (
                <div
                  key={index}
                  className={`character-card ${selectedCharacter?.name === character.name ? 'selected' : ''}`}
                  onClick={() => handleCharacterClick(character)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: selectedCharacter?.name === character.name ? 'linear-gradient(90deg,#1890ff 0%,#40a9ff 100%)' : 'rgba(255,255,255,0.1)',
                    color: selectedCharacter?.name === character.name ? '#fff' : '#333',
                    fontWeight: 500,
                    fontSize: 16,
                    boxShadow: selectedCharacter?.name === character.name ? '0 2px 12px #1890ff44' : 'none',
                    cursor: 'pointer',
                    border: selectedCharacter?.name === character.name ? '2px solid #1890ff' : '2px solid transparent',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  {character.avatar && (
                    <img src={character.avatar} alt={character.name} style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', marginRight: 6, border: '2px solid #e6f7ff' }} />
                  )}
                  <h3 style={{ margin: 0 }}>{character.name}</h3>
                </div>
              ))}
            </div>
          </div>
          {selectedCharacter && (
            <div className="selected-character" style={{ flex: '1 1 400px', background: 'rgba(255,255,255,0.92)', borderRadius: 18, boxShadow: '0 2px 16px #1890ff11', padding: 16, minWidth: 260, overflowX: 'auto' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1890ff', marginBottom: 12, textAlign: 'center' }}>{selectedCharacter.name} 的时间轴</h2>
              <div className="timeline-container" style={{ width: '100%', minHeight: 400, position: 'relative', paddingBottom: 8 }}>
                <VerticalTimelineAnimated history={selectedCharacter.history || []} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default History;
