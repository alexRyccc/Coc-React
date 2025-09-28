import React, { useState } from 'react';
import { useSpring, animated } from 'react-spring';
import { Modal } from 'antd';
import ReactECharts from 'echarts-for-react';
import './Home.css';
import maleOldImage from './images/male-old.png';
import maleYoungImage from './images/male-young.png';
import femaleOldImage from './images/female-old.png';
import femaleYoungImage from './images/female-young.png';
import sampleCharacters from '../sampleCharacter';
import backgroundImage from './images/background.jpg'; 
import Sidebar from '../Sidebar';
import skillTranslations from '../datas/skillTranslations';

const getCharacterImage = (character) => {
  if (character.gender === 'male') {
    return character.age > 40 ? maleOldImage : maleYoungImage;
  } else {
    return character.age > 40 ? femaleOldImage : femaleYoungImage;
  }
};

const getCharacterClass = (character) => {
  if (character.gender === 'male') {
    return character.age > 40 ? 'male-old' : 'male-young';
  } else {
    return character.age > 40 ? 'female-old' : 'female-young';
  }
};



const Home = () => {
  
  const [rotation, setRotation] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  // 移除悬停雷达图相关状态
  const [showDetail, setShowDetail] = useState(false);
  const [locale, setLocale] = useState('cn');
  // 简单加载本地语言包
  const locales = {
    cn: require('./locales/cn.json'),
    en: require('./locales/en.json'),
  };
  const t = (keyPath) => {
    const keys = keyPath.split('.');
    let value = locales[locale];
    for (let k of keys) {
      value = value && value[k];
    }
    return value || keyPath;
  };
  // 属性字段本地化
  const attributeKeys = [
    'str', 'dex', 'int', 'con', 'app', 'pow', 'siz', 'edu', 'luck', 'hp', 'mp', 'san'
  ];
  const attributeLabels = {
    str: t('attribute.str'),
    dex: t('attribute.dex'),
    int: t('attribute.int'),
    con: t('attribute.con'),
    app: t('attribute.app'),
    pow: t('attribute.pow'),
    siz: t('attribute.siz'),
    edu: t('attribute.edu'),
    luck: t('attribute.luck'),
    hp: t('attribute.hp'),
    mp: t('attribute.mp'),
    san: t('attribute.san'),
  };

  const characters = sampleCharacters; // Use sampleCharacters array

  const handleScroll = (event) => {
    setRotation(rotation + event.deltaY * 0.2);
  };

  const handleCardClick = (character) => {
  setSelectedCharacter(character);
  setShowDetail(true);
  };

  const handleClose = () => {
    setShowDetail(false);
    setSelectedCharacter(null);
  };

  // 移除悬停雷达图相关事件

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa', position: 'relative' }}>
      <Sidebar />
      {/* Header with language switch */}
      <div style={{ width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', padding: '12px 0 8px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginLeft: 16 }}>{t('header.title')}</div>
        <button
          style={{ marginRight: 16, padding: '6px 16px', fontSize: 15, background: '#1890ff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => setLocale(locale === 'cn' ? 'en' : 'cn')}
        >{t('header.switchLang')}</button>
      </div>
      <div className="character-container" onWheel={handleScroll} style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', minHeight: '100vh', padding: '12px 0', position: 'relative', zIndex: 1 }}>
        <div className="carousel" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          justifyContent: 'center',
          alignItems: 'stretch',
          position: 'relative',
          zIndex: 1,
          padding: '8px',
        }}>
          {characters.map((character, index) => {
            const characterClass = getCharacterClass(character);
            // 已移除 hoveredCharacter，卡片不再有悬停动画
            const isHovered = false;
            // 分离 spring 动画类型，避免混用
            const scaleSpring = useSpring({
              transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              config: { tension: 300, friction: 20 },
            });
            // boxShadow、border 直接用 style 切换，不做 spring 动画
            const avatarSpring = useSpring({
              opacity: isHovered ? 1 : 0.95,
            });
            return (
              <animated.div
                key={index}
                className={`character-card ${characterClass} ${isHovered ? 'hovered' : ''}`}
                style={{
                  ...scaleSpring,
                  width: '100%',
                  maxWidth: 400,
                  background: 'linear-gradient(135deg, #e3f0ff 0%, #fff 100%)',
                  borderRadius: 20,
                  margin: '0 auto',
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  transition: 'box-shadow 0.2s',
                  cursor: 'pointer',
                  boxShadow: isHovered ? '0 6px 32px rgba(24,144,255,0.18)' : '0 2px 12px rgba(0,0,0,0.08)',
                  border: isHovered ? '2px solid #1890ff' : '2px solid transparent',
                }}
                // 移除悬停事件
                onClick={() => handleCardClick(character)}
              >
                {/* 头像放在名字正上方，确保图片路径和样式正确 */}
                <animated.div style={{
                  ...avatarSpring,
                  width: 110,
                  height: 110,
                  marginBottom: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: isHovered ? 'linear-gradient(135deg,#bae7ff 0%,#e6f7ff 100%)' : '#eee',
                  boxShadow: isHovered ? '0 0 0 4px #1890ff33' : 'none',
                  transition: 'background 0.2s',
                }}>
                  <img
                    src={getCharacterImage(character)}
                    alt={character.name ? `${character.name}头像` : '角色头像'}
                    className="character-image"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </animated.div>
                <div
                  className={`character-info character-info-${character.name.replace(/\s+/g, '').toLowerCase()}`}
                  style={{ width: '100%', textAlign: 'center', marginBottom: 8, fontSize: 16 }}
                >
                  <h3 style={{ fontSize: 22, margin: '4px 0', fontWeight: 700, color: '#1890ff' }}>{character.name}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: 15, marginBottom: 8 }}>
                    <span>{t('character.age')}: {character.age}</span>
                    <span>{t('character.gender')}: {character.gender}</span>
                  </div>
                  <div style={{ fontSize: 15, marginBottom: 8, color: '#555' }}>{t('character.profession')}: {character.profession}</div>
                </div>
                {/* 雷达图直接显示在卡片中 */}
                <div style={{ width: '100%', marginBottom: 8 }}>
                  <ReactECharts
                    style={{ height: 220, width: '100%' }}
                    option={{
                      tooltip: {},
                      radar: {
                        indicator: [
                          { name: t('attribute.str'), max: 100 },
                          { name: t('attribute.dex'), max: 100 },
                          { name: t('attribute.int'), max: 100 },
                          { name: t('attribute.con'), max: 100 },
                          { name: t('attribute.app'), max: 100 },
                          { name: t('attribute.pow'), max: 100 },
                          { name: t('attribute.siz'), max: 100 },
                          { name: t('attribute.edu'), max: 100 },
                          { name: t('attribute.luck'), max: 100 },
                        ],
                        shape: 'circle',
                        splitNumber: 5,
                        axisName: {
                          color: '#333',
                          fontWeight: 'bold',
                          fontSize: 13,
                          formatter: function(value, indicator) {
                            const values = [
                              character.str,
                              character.dex,
                              character.int,
                              character.con,
                              character.app,
                              character.pow,
                              character.siz,
                              character.edu,
                              character.luck,
                            ];
                            const names = [
                              t('attribute.str'),
                              t('attribute.dex'),
                              t('attribute.int'),
                              t('attribute.con'),
                              t('attribute.app'),
                              t('attribute.pow'),
                              t('attribute.siz'),
                              t('attribute.edu'),
                              t('attribute.luck'),
                            ];
                            const idx = names.indexOf(value);
                            return `${value}\n${values[idx]}`;
                          }
                        },
                      },
                      series: [{
                        type: 'radar',
                        data: [
                          {
                            value: [
                              character.str,
                              character.dex,
                              character.int,
                              character.con,
                              character.app,
                              character.pow,
                              character.siz,
                              character.edu,
                              character.luck,
                            ],
                            name: character.name,
                            areaStyle: { opacity: 0.2 },
                            lineStyle: { width: 3 },
                            symbol: 'circle',
                            itemStyle: { color: '#1890ff' },
                          },
                        ],
                      }],
                    }}
                  />
                </div>
                <button
                  style={{
                    marginTop: 4,
                    padding: '10px 0',
                    width: '100%',
                    fontSize: 16,
                    background: isHovered ? 'linear-gradient(90deg,#1890ff 0%,#40a9ff 100%)' : '#1890ff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 500,
                    letterSpacing: 1,
                    boxShadow: isHovered ? '0 2px 12px #1890ff44' : 'none',
                    transition: 'background 0.2s',
                  }}
                  onClick={() => {
                    setSelectedCharacter(character);
                    setShowDetail(true);
                  }}
                >{t('button.viewDetail')}</button>
              </animated.div>
            );
          })}
        </div>
        {/* 原有弹窗内容 */}
        {showDetail && selectedCharacter && (
          <div className="overlay" onClick={handleClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, width: '95vw', maxHeight: '90vh', borderRadius: 16, padding: 0, background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.15)', zIndex: 10000, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src={getCharacterImage(selectedCharacter)} alt={`${selectedCharacter.name}${t('character.image')}`} style={{ width: 90, borderRadius: '50%', marginBottom: 10 }} />
                <h2 style={{ fontSize: 22, margin: '8px 0' }}>{selectedCharacter.name}</h2>
                <div style={{ fontSize: 16, marginBottom: 8 }}>{t('character.profession')}: {selectedCharacter.profession} | {t('character.gender')}: {selectedCharacter.gender} | {t('character.age')}: {selectedCharacter.age}</div>
                <div style={{ width: '100%', marginBottom: 12, overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 15, marginBottom: 8 }}>
                    <tbody>
                      <tr>
                        <th style={{ width: 60 }}>{attributeLabels.str}</th><td>{selectedCharacter.str}</td>
                        <th style={{ width: 60 }}>{attributeLabels.dex}</th><td>{selectedCharacter.dex}</td>
                      </tr>
                      <tr>
                        <th>{attributeLabels.int}</th><td>{selectedCharacter.int}</td>
                        <th>{attributeLabels.con}</th><td>{selectedCharacter.con}</td>
                      </tr>
                      <tr>
                        <th>{attributeLabels.app}</th><td>{selectedCharacter.app}</td>
                        <th>{attributeLabels.pow}</th><td>{selectedCharacter.pow}</td>
                      </tr>
                      <tr>
                        <th>{attributeLabels.siz}</th><td>{selectedCharacter.siz}</td>
                        <th>{attributeLabels.edu}</th><td>{selectedCharacter.edu}</td>
                      </tr>
                      <tr>
                        <th>{attributeLabels.luck}</th><td>{selectedCharacter.luck}</td>
                        <th>{attributeLabels.hp}</th><td>{selectedCharacter.hp}</td>
                      </tr>
                      <tr>
                        <th>{attributeLabels.mp}</th><td>{selectedCharacter.mp}</td>
                        <th>{attributeLabels.san}</th><td>{selectedCharacter.san}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ width: '100%', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 17, margin: '8px 0' }}>{t('modal.skillList')}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(selectedCharacter.skills).map(([skill, values]) => (
                      <div key={skill} style={{ background: '#f5f5f5', borderRadius: 8, padding: '4px 8px', fontSize: 14 }}>
                        <span>{t(`skill.${skill}`)}: </span>
                        <span style={{ color: '#1890ff' }}>{values.current}</span>
                        <span style={{ color: '#aaa', marginLeft: 4 }}>({values.initial})</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ width: '100%', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 17, margin: '8px 0' }}>{t('modal.backgroundStory')}</h3>
                  <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                    <div><b>{t('modal.personalDescription')}：</b>{selectedCharacter.background.personalDescription}</div>
                    <div><b>{t('modal.ideologyBeliefs')}：</b>{selectedCharacter.background.ideologyBeliefs}</div>
                    <div><b>{t('modal.significantPeople')}：</b>{selectedCharacter.background.significantPeople}</div>
                    <div><b>{t('modal.importantLocations')}：</b>{selectedCharacter.background.importantLocations}</div>
                    <div><b>{t('modal.treasuredPossessions')}：</b>{selectedCharacter.background.treasuredPossessions}</div>
                  </div>
                </div>
                <div style={{ width: '100%', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 17, margin: '8px 0' }}>{t('modal.items')}</h3>
                  <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                    <div>{t('modal.item1')}</div>
                    <div>{t('modal.item2')}</div>
                    <div>{t('modal.item3')}</div>
                  </div>
                </div>
                <div style={{ width: '100%', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 17, margin: '8px 0' }}>{t('modal.assets')}</h3>
                  <div style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                    <div>{t('modal.cash')}: 18.00</div>
                    <div>{t('modal.property')}: 450.00</div>
                    <div>{t('modal.spendingLevel')}: 10.00</div>
                  </div>
                </div>
                <button onClick={handleClose} style={{ width: '100%', padding: '12px 0', fontSize: 18, background: '#1890ff', color: '#fff', border: 'none', borderRadius: 8, marginTop: 8, fontWeight: 500 }}>{t('button.close')}</button>
              </div>
            </div>
          </div>
        )}
        {/* 新增：Ant Design Modal 雷达图弹窗 */}
  {/* 已移除鼠标悬停雷达图弹窗 */}
      </div>
    </div>
  );
};

export default Home;