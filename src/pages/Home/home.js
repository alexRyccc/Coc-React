import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import ReactECharts from 'echarts-for-react';
import './Home.css';
import maleOldImage from './images/male-old.png';
import maleYoungImage from './images/male-young.png';
import femaleOldImage from './images/female-old.png';
import femaleYoungImage from './images/female-young.png';
import { useSelector, useDispatch } from 'react-redux';
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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDetail, setShowDetail] = useState(false);
  const [locale, setLocale] = useState('cn');
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
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

  const user = useSelector(state => state.user);
  const rawCharacters = useSelector(state => state.characters || []);
  console.log('Fetched characters:', rawCharacters);
  console.log('User state:', user);
  
  // 自动转换为sampleCharacters格式
  function convertToSampleCharacter(apiCharacter) {
    if (!apiCharacter) return null;
    
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
  
  // 处理角色数据
  const characters = rawCharacters && rawCharacters.length > 0
    ? (Array.isArray(rawCharacters)
        ? rawCharacters.map(convertToSampleCharacter).filter(Boolean)
        : [convertToSampleCharacter(rawCharacters)].filter(Boolean))
    : [];
  
  console.log('Final characters:', characters);
  const dispatch = useDispatch();

  useEffect(() => {
    // 只有在用户已登录时才获取角色
    if (user) {
      console.log('User logged in, fetching characters. User:', user);
      dispatch({ type: 'FETCH_CHARACTERS' });
    } else {
      console.log('User not logged in');
    }
  }, [dispatch, user]);

  // 处理触摸滑动
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd || isAnimating) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && selectedIndex < characters.length - 1) {
      setIsAnimating(true);
      setSelectedIndex(selectedIndex + 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
    if (isRightSwipe && selectedIndex > 0) {
      setIsAnimating(true);
      setSelectedIndex(selectedIndex - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  // 处理鼠标滚轮
  const handleWheel = (e) => {
    if (isAnimating) return;
    
    e.preventDefault();
    const delta = e.deltaY;
    
    if (delta > 0 && selectedIndex < characters.length - 1) {
      setIsAnimating(true);
      setSelectedIndex(selectedIndex + 1);
      setTimeout(() => setIsAnimating(false), 300);
    } else if (delta < 0 && selectedIndex > 0) {
      setIsAnimating(true);
      setSelectedIndex(selectedIndex - 1);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const handleCardClick = (index) => {
    if (index === selectedIndex) {
      setShowDetail(true);
    } else {
      if (!isAnimating) {
        setIsAnimating(true);
        setSelectedIndex(index);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }
  };

  const handleClose = () => {
    setShowDetail(false);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      {/* 背景遮罩 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
        zIndex: 1
      }} />
      
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Sidebar />
        
        {/* Header */}
        <div style={{ 
          width: '100%', 
          background: 'rgba(255,255,255,0.95)', 
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)', 
          padding: '15px 0', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          position: 'sticky', 
          top: 0, 
          zIndex: 100 
        }}>
        <div style={{ fontSize: 24, fontWeight: 700, marginLeft: 20, color: '#333' }}>
          {t('header.title')}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginRight: 20 }}>
          <button
            style={{ 
              padding: '8px 16px', 
              fontSize: 14, 
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 20, 
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(40, 167, 69, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              console.log('Manual fetch characters clicked');
              dispatch({ type: 'FETCH_CHARACTERS' });
            }}
          >
            刷新角色
          </button>
          <button
            style={{ 
              padding: '8px 20px', 
              fontSize: 16, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 25, 
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setLocale(locale === 'cn' ? 'en' : 'cn')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}
          >
            {t('header.switchLang')}
          </button>
        </div>
      </div>

      {/* 卡片容器 */}
      <div 
        className="cards-container"
        style={{ 
          height: 'calc(100vh - 80px)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          padding: '20px',
          perspective: '1000px'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {characters.length === 0 ? (
          // 空状态显示
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.9)',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            padding: '40px',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📝</div>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>暂无角色数据</h3>
            <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.7)' }}>
              {user ? '请点击上方"刷新角色"按钮获取角色数据，或创建新角色' : '请先登录以查看您的角色'}
            </p>
            {user && (
              <button
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onClick={() => {
                  console.log('Refresh button clicked from empty state');
                  dispatch({ type: 'FETCH_CHARACTERS' });
                }}
              >
                刷新角色数据
              </button>
            )}
          </div>
        ) : (
          // 角色卡片
          <>
        {characters.map((character, index) => {
          const offset = index - selectedIndex;
          const isSelected = index === selectedIndex;
          // 堆叠效果参数
          const cardWidth = 300;
          const overlap = cardWidth * 0.33; // 漏出三分之一
          let translateX = 0;
          let zIndex = 10 + index;
          let opacity = 1;
          let showName = false;
          if (isSelected) {
            translateX = 0;
            zIndex = 100;
            opacity = 1;
            showName = true;
          } else if (index < selectedIndex) {
            // 左侧卡片
            translateX = (index - selectedIndex) * overlap;
            zIndex = 50 + index;
            opacity = 0.85;
            showName = true;
          } else if (index > selectedIndex) {
            // 右侧卡片
            translateX = (index - selectedIndex) * overlap;
            zIndex = 50 - index;
            opacity = 0.85;
            showName = true;
          }
          return (
            <div
              key={index}
              className={`character-card ${isSelected ? 'selected' : ''}`}
              style={{
                position: 'absolute',
                width: cardWidth + 'px',
                height: '480px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
                borderRadius: '20px',
                boxShadow: isSelected 
                  ? '0 18px 36px rgba(0,0,0,0.25), 0 0 0 2px rgba(102, 126, 234, 0.4)' 
                  : '0 8px 16px rgba(0,0,0,0.12)',
                transform: `translateX(${translateX}px)`,
                opacity: opacity,
                transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.25s cubic-bezier(0.4,0,0.2,1)',
                cursor: 'pointer',
                zIndex: zIndex,
                border: isSelected 
                  ? '2px solid rgba(102, 126, 234, 0.5)' 
                  : '1px solid rgba(255,255,255,0.2)',
                padding: '25px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                willChange: 'transform, opacity',
                backgroundClip: 'padding-box',
                overflow: 'hidden',
              }}
              onClick={() => handleCardClick(index)}
            >
              {/* 头像，仅主卡显示 */}
              {isSelected && (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  padding: '3px',
                  marginBottom: '15px',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: '#fff'
                  }}>
                    <img
                      src={getCharacterImage(character)}
                      alt={`${character.name}头像`}
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 姓名，所有卡片都显示 */}
              {showName && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: isSelected ? '20px' : '0',
                  width: '100%',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: isSelected ? '24px' : '16px',
                  color: isSelected ? '#333' : '#888',
                  background: isSelected ? 'none' : 'rgba(255,255,255,0.7)',
                  borderRadius: isSelected ? '0' : '10px',
                  padding: isSelected ? '0' : '4px 0',
                  position: isSelected ? 'static' : 'absolute',
                  top: isSelected ? undefined : '10px',
                  left: 0,
                  right: 0,
                  zIndex: 200,
                  boxShadow: isSelected ? 'none' : '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  {character.name}
                </div>
              )}

              {/* 角色信息，仅主卡显示 */}
              {isSelected && (
                <div style={{ textAlign: 'center', marginBottom: '20px', width: '100%' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '14px', 
                    color: '#666',
                    marginBottom: '8px',
                    padding: '0 10px'
                  }}>
                    <span>{t('character.age')}: {character.age}</span>
                    <span>{t('character.gender')}: {character.gender}</span>
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#888',
                    fontStyle: 'italic'
                  }}>
                    {character.profession}
                  </div>
                </div>
              )}

              {/* 雷达图，仅主卡显示 */}
              {isSelected && (
                <div style={{ 
                  width: '100%', 
                  height: '200px',
                  marginBottom: '15px',
                  transform: 'translateY(-10px)'
                }}>
                  <ReactECharts
                    style={{ height: '100%', width: '100%' }}
                    option={{
                      tooltip: {
                        trigger: 'item'
                      },
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
                        splitNumber: 4,
                        radius: '70%',
                        axisName: {
                          color: '#555',
                          fontWeight: '600',
                          fontSize: 11
                        },
                        splitLine: {
                          lineStyle: {
                            color: 'rgba(102, 126, 234, 0.2)'
                          }
                        },
                        splitArea: {
                          show: true,
                          areaStyle: {
                            color: ['rgba(102, 126, 234, 0.05)', 'rgba(102, 126, 234, 0.1)']
                          }
                        }
                      },
                      series: [{
                        type: 'radar',
                        data: [{
                          value: [
                            character.str, character.dex, character.int,
                            character.con, character.app, character.pow,
                            character.siz, character.edu, character.luck,
                          ],
                          name: character.name,
                          areaStyle: { 
                            opacity: 0.3,
                            color: 'rgba(102, 126, 234, 0.3)'
                          },
                          lineStyle: { 
                            width: 2,
                            color: '#667eea'
                          },
                          symbol: 'circle',
                          symbolSize: 6,
                          itemStyle: { 
                            color: '#667eea',
                            shadowColor: 'rgba(102, 126, 234, 0.5)',
                            shadowBlur: 10
                          }
                        }]
                      }]
                    }}
                  />
                </div>
              )}

              {/* 查看详情按钮，仅主卡显示 */}
              {isSelected && (
                <button
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    fontSize: '16px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    animation: 'fadeInUp 0.5s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetail(true);
                  }}
                >
                  {t('button.viewDetail')}
                </button>
              )}
            </div>
          );
        })}

        {/* 导航指示器 */}
        <div style={{
          position: 'absolute',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '10px',
          zIndex: 20
        }}>
          {characters.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === selectedIndex ? '20px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: index === selectedIndex 
                  ? 'rgba(255,255,255,0.9)' 
                  : 'rgba(255,255,255,0.4)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: index === selectedIndex 
                  ? '0 2px 8px rgba(255,255,255,0.3)' 
                  : 'none'
              }}
              onClick={() => {
                if (!isAnimating) {
                  setIsAnimating(true);
                  setSelectedIndex(index);
                  setTimeout(() => setIsAnimating(false), 400);
                }
              }}
            />
          ))}
        </div>
        </>
        )}
      </div>

      {/* 详情弹窗 */}
      {showDetail && characters[selectedIndex] && (
        <div 
          className="overlay" 
          onClick={handleClose} 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100vh', 
            background: 'rgba(0,0,0,0.6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999,
            backdropFilter: 'blur(5px)'
          }}
        >
          <div 
            className="modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '400px', 
              width: '95vw', 
              maxHeight: '90vh', 
              borderRadius: '20px', 
              padding: 0, 
              background: 'rgba(255,255,255,0.95)', 
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
              zIndex: 10000, 
              overflow: 'hidden', 
              display: 'flex', 
              flexDirection: 'column',
              border: '1px solid rgba(255,255,255,0.3)'
            }}
          >
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              padding: '25px', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center' 
            }}>
              <img 
                src={getCharacterImage(characters[selectedIndex])} 
                alt={`${characters[selectedIndex].name}头像`} 
                style={{ 
                  width: '100px', 
                  height: '100px',
                  borderRadius: '50%', 
                  marginBottom: '15px',
                  border: '3px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
                }} 
              />
              <h2 style={{ 
                fontSize: '26px', 
                margin: '10px 0',
                color: '#333',
                fontWeight: '700'
              }}>
                {characters[selectedIndex].name}
              </h2>
              <div style={{ 
                fontSize: '16px', 
                marginBottom: '20px',
                color: '#666',
                textAlign: 'center'
              }}>
                {characters[selectedIndex].profession} | {characters[selectedIndex].gender} | {characters[selectedIndex].age}岁
              </div>
              
              {/* 属性表格 */}
              <div style={{ width: '100%', marginBottom: '20px' }}>
                <table style={{ 
                  width: '100%', 
                  fontSize: '14px', 
                  borderCollapse: 'collapse',
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '10px',
                  overflow: 'hidden'
                }}>
                  <tbody>
                    <tr>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.str}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].str}</td>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.dex}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].dex}</td>
                    </tr>
                    <tr>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.int}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].int}</td>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.con}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].con}</td>
                    </tr>
                    <tr>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.app}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].app}</td>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.pow}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].pow}</td>
                    </tr>
                    <tr>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.siz}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].siz}</td>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.edu}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].edu}</td>
                    </tr>
                    <tr>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.luck}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].luck}</td>
                      <th style={{ 
                        padding: '8px', 
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: '#333',
                        fontWeight: '600'
                      }}>{attributeLabels.hp}</th>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{characters[selectedIndex].hp}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 技能列表 */}
              {characters[selectedIndex].skills && (
                <div style={{ width: '100%', marginBottom: '20px' }}>
                  <h3 style={{ 
                    fontSize: '18px', 
                    margin: '0 0 15px 0',
                    color: '#333',
                    fontWeight: '600'
                  }}>
                    {t('modal.skillList')}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '8px' 
                  }}>
                    {Object.entries(characters[selectedIndex].skills).map(([skill, values]) => (
                      <div 
                        key={skill} 
                        style={{ 
                          background: 'rgba(102, 126, 234, 0.1)', 
                          borderRadius: '15px', 
                          padding: '6px 12px', 
                          fontSize: '13px',
                          border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}
                      >
                        <span style={{ fontWeight: '600' }}>{t(`skill.${skill}`)}: </span>
                        <span style={{ color: '#667eea' }}>{values.current}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 关闭按钮 */}
              <button 
                onClick={handleClose} 
                style={{ 
                  width: '100%', 
                  padding: '15px 0', 
                  fontSize: '18px', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '25px', 
                  marginTop: '10px', 
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                {t('button.close')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Home;