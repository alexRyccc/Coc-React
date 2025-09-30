import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './newPerson.css';
import skillTranslations from '../datas/skillTranslations';
import initialSkillValues from '../datas/initialSkillValues';
import Sidebar from '../Sidebar';

const NewPerson = () => {
  const dispatch = useDispatch();
  const { isCreatingCharacter, createCharacterError, user } = useSelector(state => state);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [gender, setGender] = useState('');
  const [currentResidence, setCurrentResidence] = useState('');
  const [birthplace, setBirthplace] = useState('');
  const [str, setStr] = useState('');
  const [dex, setDex] = useState('');
  const [int, setInt] = useState('');
  const [con, setCon] = useState('');
  const [app, setApp] = useState('');
  const [pow, setPow] = useState('');
  const [siz, setSiz] = useState('');
  const [edu, setEdu] = useState('');
  const [luck, setLuck] = useState('');
  const [hp, setHp] = useState('');
  const [mp, setMp] = useState('');
  const [san, setSan] = useState('');
  
  // 使用技能对象而不是数组，便于后续格式化
  const [skillValues, setSkillValues] = useState({});
  
  // 新增：技能点分配系统
  const [skillPoints, setSkillPoints] = useState({
    professional: 0, // 职业点
    interest: 0      // 兴趣点
  });
  const [skillAllocation, setSkillAllocation] = useState({}); // 各技能分配的点数
  
  const [backgroundStory, setBackgroundStory] = useState({
    personalDescription: '',
    ideologyBeliefs: '',
    significantPeople: '',
    importantLocations: '',
    treasuredPossessions: ''
  });
  const [items, setItems] = useState([{ name: '', description: '' }]);
  const [history, setHistory] = useState([{ time: '', event: '' }]);
  
  // 新增状态：投骰子相关
  const [rollingStates, setRollingStates] = useState({
    str: false,
    dex: false,
    int: false,
    con: false,
    app: false,
    pow: false,
    siz: false,
    edu: false,
    luck: false
  });
  const [totalRollCount, setTotalRollCount] = useState(0); // 总重投次数
  const [attributesRolled, setAttributesRolled] = useState({
    str: false,
    dex: false,
    int: false,
    con: false,
    app: false,
    pow: false,
    siz: false,
    edu: false,
    luck: false
  });
  const [showGiantDice, setShowGiantDice] = useState(false); // 显示中央大骰子
  const [formProgress, setFormProgress] = useState(0); // 表单完成进度
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' }); // 状态消息
  const [isRollingAll, setIsRollingAll] = useState(false); // 一键全投状态
  
  // 新增：提交相关状态
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 计算表单完成进度
  const calculateProgress = () => {
    let completed = 0;
    let total = 16; // 总字段数
    
    // 基本信息 (6个字段)
    if (name) completed++;
    if (age) completed++;
    if (profession) completed++;
    if (gender) completed++;
    if (currentResidence) completed++;
    if (birthplace) completed++;
    
    // 属性 (9个属性)
    const attributes = [str, dex, int, con, app, pow, siz, edu, luck];
    completed += attributes.filter(attr => attr).length;
    
    // 背景故事 (1个，如果至少填了一个字段)
    if (backgroundStory.personalDescription || backgroundStory.ideologyBeliefs || 
        backgroundStory.significantPeople || backgroundStory.importantLocations || 
        backgroundStory.treasuredPossessions) {
      completed++;
    }
    
    const progress = Math.round((completed / total) * 100);
    setFormProgress(progress);
    return progress;
  };

  // 监听表单变化
  useEffect(() => {
    calculateProgress();
  }, [name, age, profession, gender, currentResidence, birthplace, str, dex, int, con, app, pow, siz, edu, luck, backgroundStory]);

  // 计算技能点
  useEffect(() => {
    if (edu && int) {
      const professionalPoints = parseInt(edu) * 4;
      const interestPoints = parseInt(int) * 2;
      setSkillPoints({
        professional: professionalPoints,
        interest: interestPoints
      });
    }
  }, [edu, int]);

  // 计算属性总览
  const getAttributesSummary = () => {
    const attributes = [str, dex, int, con, app, pow, siz, edu, luck].filter(attr => attr).map(attr => parseInt(attr));
    if (attributes.length === 0) return null;
    
    const total = attributes.reduce((sum, attr) => sum + attr, 0);
    const average = Math.round(total / attributes.length);
    const maxAttr = Math.max(...attributes);
    const minAttr = Math.min(...attributes);
    
    // 评级逻辑
    const getRating = (value) => {
      if (value >= 80) return 'excellent';
      if (value >= 65) return 'good';
      if (value >= 50) return 'average';
      return 'poor';
    };
    
    return {
      total,
      average,
      maxAttr,
      minAttr,
      count: attributes.length,
      totalRating: getRating(total / 9), // 假设满分为90*9=810
      averageRating: getRating(average),
      maxRating: getRating(maxAttr)
    };
  };

  // 投骰子函数 - 3D6
  const rollDice = () => {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  };

  // 投骰子函数 - 2D6+6 (用于某些属性)
  const rollDiceSpecial = () => {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1 + 6;
  };

  // 投骰子函数 - 3D6*5 (用于幸运值)
  const rollLuck = () => {
    return rollDice() * 5;
  };

  // 投骰子函数 - 2D6+6 然后*5 (用于教育)
  const rollEducation = () => {
    return rollDiceSpecial() * 5;
  };

  // 一键全投功能
  const rollAllAttributes = () => {
    setIsRollingAll(true);
    setShowGiantDice(true);
    
    // 检查是否是重新全投
    const hasAnyAttribute = Object.values(attributesRolled).some(rolled => rolled);
    if (hasAnyAttribute) {
      setStatusMessage({ type: 'info', message: '正在重新投掷所有属性...' });
    } else {
      setStatusMessage({ type: 'info', message: '正在投掷所有属性...' });
    }
    
    setTimeout(() => {
      // 投掷所有属性
      const newStr = rollDice() * 5;
      const newDex = rollDice() * 5;
      const newInt = rollDice() * 5;
      const newCon = rollDice() * 5;
      const newApp = rollDice() * 5;
      const newPow = rollDice() * 5;
      const newSiz = rollDice() * 5;
      const newEdu = rollEducation();
      const newLuck = rollLuck();
      
      // 设置所有属性值
      setStr(newStr);
      setDex(newDex);
      setInt(newInt);
      setCon(newCon);
      setApp(newApp);
      setPow(newPow);
      setSiz(newSiz);
      setEdu(newEdu);
      setLuck(newLuck);
      
      // 标记所有属性已投掷
      setAttributesRolled({
        str: true,
        dex: true,
        int: true,
        con: true,
        app: true,
        pow: true,
        siz: true,
        edu: true,
        luck: true
      });
      
      // 重置重投次数
      setTotalRollCount(0);
      
      setIsRollingAll(false);
      setShowGiantDice(false);
      
      if (hasAnyAttribute) {
        setStatusMessage({ type: 'success', message: '所有属性重新投掷完成！重投次数已重置为3次。' });
      } else {
        setStatusMessage({ type: 'success', message: '所有属性投掷完成！你有3次重投机会。' });
      }
      
      // 清除状态消息
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 5000);
    }, 2000); // 增加动画时间让用户感受到全投的过程
  };

  // 计算派生属性
  const calculateDerivedStats = () => {
    if (str && con && pow && siz) {
      const strVal = parseInt(str) || 0;
      const conVal = parseInt(con) || 0;
      const powVal = parseInt(pow) || 0;
      const sizVal = parseInt(siz) || 0;
      
      // 生命值 = (体质 + 体型) / 10，四舍五入
      const hpVal = Math.round((conVal + sizVal) / 10);
      
      // 魔法值 = 意志 / 5，四舍五入
      const mpVal = Math.round(powVal / 5);
      
      // 理智值 = 意志值
      const sanVal = powVal;
      
      setHp(hpVal.toString());
      setMp(mpVal.toString());
      setSan(sanVal.toString());
    }
  };

  // 单个属性投骰子
  const rollSingleAttribute = (attributeKey) => {
    // 检查是否已达到总重投次数限制
    if (attributesRolled[attributeKey] && totalRollCount >= 3) {
      alert('总共只能重新投骰3次！');
      return;
    }

    setRollingStates(prev => ({ ...prev, [attributeKey]: true }));
    setShowGiantDice(true); // 显示中央大骰子
    
    // 模拟骰子动画时间
    setTimeout(() => {
      let value;
      switch (attributeKey) {
        case 'int':
        case 'siz':
          value = rollDiceSpecial() * 5;
          break;
        case 'edu':
          value = rollEducation();
          break;
        case 'luck':
          value = rollLuck();
          break;
        default:
          value = rollDice() * 5;
      }
      
      // 设置属性值
      switch (attributeKey) {
        case 'str': setStr(value.toString()); break;
        case 'dex': setDex(value.toString()); break;
        case 'int': setInt(value.toString()); break;
        case 'con': setCon(value.toString()); break;
        case 'app': setApp(value.toString()); break;
        case 'pow': setPow(value.toString()); break;
        case 'siz': setSiz(value.toString()); break;
        case 'edu': setEdu(value.toString()); break;
        case 'luck': setLuck(value.toString()); break;
      }
      
      setRollingStates(prev => ({ ...prev, [attributeKey]: false }));
      setShowGiantDice(false); // 隐藏中央大骰子
      
      // 如果是重投，增加总重投次数
      if (attributesRolled[attributeKey]) {
        setTotalRollCount(prev => prev + 1);
      }
      
      setAttributesRolled(prev => ({ ...prev, [attributeKey]: true }));
    }, 1500); // 1.5秒动画时间
  };

  // 监听属性变化，自动计算派生属性
  useEffect(() => {
    calculateDerivedStats();
  }, [str, con, pow, siz]);

  // 监听创建结果
  useEffect(() => {
    if (createCharacterError) {
      alert('角色创建失败: ' + (createCharacterError.response?.data?.message || createCharacterError.message));
    }
  }, [createCharacterError]);

  // 当组件加载时，初始化技能值
  useEffect(() => {
    setSkillValues(initialSkillValues);
  }, []);

  // 计算剩余技能点
  const getRemainingSkillPoints = () => {
    const totalAllocated = Object.values(skillAllocation).reduce((sum, allocation) => {
      return sum + (allocation.professional || 0) + (allocation.interest || 0);
    }, 0);
    
    const allocatedProfessional = Object.values(skillAllocation).reduce((sum, allocation) => {
      return sum + (allocation.professional || 0);
    }, 0);
    
    const allocatedInterest = Object.values(skillAllocation).reduce((sum, allocation) => {
      return sum + (allocation.interest || 0);
    }, 0);
    
    return {
      professional: skillPoints.professional - allocatedProfessional,
      interest: skillPoints.interest - allocatedInterest
    };
  };

  // 技能分配函数 - 直接设置值
  const handleSkillAllocation = (skillKey, pointType, value) => {
    const currentAllocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
    const remaining = getRemainingSkillPoints();
    const initialValue = initialSkillValues[skillKey]?.initial || 0;
    
    // 确保输入值为非负整数
    const newValue = Math.max(0, parseInt(value) || 0);
    const oldValue = currentAllocation[pointType] || 0;
    const valueDifference = newValue - oldValue;
    
    // 检查是否有足够的点数
    if (valueDifference > 0 && remaining[pointType] < valueDifference) {
      setStatusMessage({ type: 'error', message: `${pointType === 'professional' ? '职业' : '兴趣'}点不足！剩余${remaining[pointType]}点` });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }
    
    // 计算最终技能值
    const otherTypeValue = currentAllocation[pointType === 'professional' ? 'interest' : 'professional'] || 0;
    const finalValue = initialValue + newValue + otherTypeValue;
    
    // 检查技能值上限
    if (pointType === 'interest' && finalValue > 70) {
      setStatusMessage({ type: 'error', message: '使用兴趣点技能值最高只能到70！' });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }
    
    if (finalValue > 80) {
      setStatusMessage({ type: 'error', message: '技能值最高只能到80！' });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }
    
    // 更新分配
    const newAllocation = {
      ...currentAllocation,
      [pointType]: newValue
    };
    
    setSkillAllocation(prev => ({
      ...prev,
      [skillKey]: newAllocation
    }));
    
    // 更新技能值
    const newSkillValue = initialValue + newAllocation.professional + newAllocation.interest;
    setSkillValues(prev => ({
      ...prev,
      [skillKey]: {
        ...prev[skillKey],
        current: newSkillValue
      }
    }));
  };

  // 快速技能点分配函数
  const handleQuickAllocation = (skillKey, pointType, points) => {
    const currentAllocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
    const newValue = Math.max(0, (currentAllocation[pointType] || 0) + points);
    handleSkillAllocation(skillKey, pointType, newValue);
  };

  // 重置单个技能的分配
  const resetSkillAllocation = (skillKey) => {
    setSkillAllocation(prev => ({
      ...prev,
      [skillKey]: { professional: 0, interest: 0 }
    }));
    
    const initialValue = initialSkillValues[skillKey]?.initial || 0;
    setSkillValues(prev => ({
      ...prev,
      [skillKey]: {
        ...prev[skillKey],
        current: initialValue
      }
    }));
  };

  // 重置所有技能分配
  const resetAllSkillAllocations = () => {
    setSkillAllocation({});
    setSkillValues(initialSkillValues);
    setStatusMessage({ type: 'success', message: '已重置所有技能分配' });
    setTimeout(() => setStatusMessage({ type: '', message: '' }), 2000);
  };

  // 计算移动力
  const calculateMoveRate = () => {
    if (str && dex && siz) {
      const strVal = parseInt(str) || 0;
      const dexVal = parseInt(dex) || 0;
      const sizVal = parseInt(siz) || 0;
      
      if (strVal < sizVal && dexVal < sizVal) {
        return 7;
      } else if (strVal > sizVal || dexVal > sizVal) {
        return 9;
      } else {
        return 8;
      }
    }
    return 8;
  };

  const handleAddSkill = () => {
    // 可以添加自定义技能的逻辑
    console.log('添加自定义技能功能待实现');
  };

  const handleAddItem = () => {
    setItems([...items, { name: '', description: '' }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleAddHistory = () => {
    setHistory([...history, { time: '', event: '' }]);
  };

  const handleHistoryChange = (index, field, value) => {
    const newHistory = [...history];
    newHistory[index][field] = value;
    setHistory(newHistory);
  };

  const handleBackgroundChange = (field, value) => {
    setBackgroundStory({ ...backgroundStory, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 防止重复提交
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    setStatusMessage({ type: '', message: '' });
    
    try {
      // 检查是否所有属性都已投骰
      const allAttributesRolled = Object.values(attributesRolled).every(rolled => rolled);
      if (!allAttributesRolled) {
        setStatusMessage({ type: 'error', message: '请为所有属性投骰子！' });
        setIsSubmitting(false);
        return;
      }
      
      // 构建技能对象，使用分配后的最终值
      const skills = {};
      Object.keys(skillValues).forEach(skillKey => {
        const allocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
        const initialValue = skillValues[skillKey]?.initial || 0;
        const finalValue = initialValue + allocation.professional + allocation.interest;
        
        // 处理特殊的技能名称映射
        let apiSkillKey = skillKey;
        if (skillKey === 'throw') {
          apiSkillKey = 'throwSkill'; // API期望的名称
        }
        skills[apiSkillKey] = finalValue;
      });
      
      // 添加自定义技能
      for (let i = 1; i <= 5; i++) {
        skills[`custom${i}`] = 1;
      }
    
      // 构建角色数据
      const characterData = {
        userId: user?.id || "1", // 从Redux store获取用户ID
        name,
        characterClass: "Ranger", // 默认值，可以添加选择
        level: 5, // 默认值，可以添加选择
        profession,
        age: parseInt(age),
        gender,
        currentResidence,
        birthplace,
        str: parseInt(str),
        con: parseInt(con),
        dex: parseInt(dex),
        app: parseInt(app),
        pow: parseInt(pow),
        siz: parseInt(siz),
        int_: parseInt(int), // 注意这里是int_
        edu: parseInt(edu),
        hp: parseInt(hp),
        mp: parseInt(mp),
        san: parseInt(san),
        luck: parseInt(luck),
        moveRate: calculateMoveRate(),
        skills,
        weapons: [
          {
            name: "徒手格斗",
            successRate: skillValues.fighting1?.current || 45,
            penetration: "无",
            damage: "1D3",
            range: "—",
            attacks: 1,
            ammo: "—",
            malfunction: "—"
          }
        ],
        background: {
          personalDescription: backgroundStory.personalDescription,
          ideologyBeliefs: backgroundStory.ideologyBeliefs,
          significantPeople: backgroundStory.significantPeople,
          importantLocations: backgroundStory.importantLocations,
          treasuredPossessions: backgroundStory.treasuredPossessions
        },
        history: history.filter(h => h.time && h.event), // 过滤掉空记录
        achievements: [{}] // 默认空成就
      };
      
      // 发送到Redux saga
      dispatch({ type: 'CREATE_CHARACTER_REQUEST', payload: characterData });
      
      // 显示成功消息
      setStatusMessage({ type: 'success', message: '角色创建中...' });
      setShowSuccessModal(true);
      
      // 3秒后导航到首页
      setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccessModal(false);
        // 这里可以添加导航逻辑
      }, 3000);
      
    } catch (error) {
      console.error('创建角色失败:', error);
      setStatusMessage({ type: 'error', message: '创建角色失败，请重试！' });
      setIsSubmitting(false);
    }
  };  return (
    <div className="new-person-container">
      <Sidebar />
      <h2>创建新角色</h2>
      
      {/* 中央大骰子动画 */}
      {showGiantDice && (
        <div className="central-dice-overlay">
          <div className="giant-dice d100">
            <div className="dice-face">D100</div>
            <div className="dice-dots">
              <span>•</span><span>••</span><span>•••</span><span>••••</span><span>•••••</span>
              <span>••••••</span><span>•••••••</span><span>••••••••</span><span>•••••••••</span><span>••••••••••</span>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <h3>基本信息</h3>
        <div className="character-tables">
          <table className="character-table">
            <tbody>
              <tr>
                <th>姓名</th>
                <td><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>年龄</th>
                <td><input type="text" value={age} onChange={(e) => setAge(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>职业</th>
                <td><input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>性别</th>
                <td><input type="text" value={gender} onChange={(e) => setGender(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>现居地</th>
                <td><input type="text" value={currentResidence} onChange={(e) => setCurrentResidence(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>出生地</th>
                <td><input type="text" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} required /></td>
              </tr>
            </tbody>
          </table>
          
          {/* 重投次数信息 */}
          <div className="total-rolls-info">
            🎲 剩余重投次数: {3 - totalRollCount}/3
          </div>
          
          {/* 状态消息 */}
          {statusMessage.message && (
            <div className={`status-message status-${statusMessage.type}`}>
              {statusMessage.message}
            </div>
          )}
          
          {/* 一键全投按钮 */}
          <button 
            type="button" 
            className="roll-all-button"
            onClick={rollAllAttributes}
            disabled={isRollingAll}
          >
            {isRollingAll ? '投掷中...' : 
             (Object.values(attributesRolled).some(rolled => rolled) ? '重新全投所有属性' : '一键全投所有属性')}
          </button>
          
          {/* 属性总览 */}
          {(() => {
            const summary = getAttributesSummary();
            return summary && summary.count >= 9 ? (
              <div className="attributes-summary">
                <div className="summary-title">🎯 属性总览</div>
                <div className="summary-stats">
                  <div className="summary-stat">
                    <div className="summary-stat-label">总值</div>
                    <div className={`summary-stat-value ${summary.totalRating}`}>{summary.total}</div>
                  </div>
                  <div className="summary-stat">
                    <div className="summary-stat-label">平均值</div>
                    <div className={`summary-stat-value ${summary.averageRating}`}>{summary.average}</div>
                  </div>
                  <div className="summary-stat">
                    <div className="summary-stat-label">最高值</div>
                    <div className={`summary-stat-value ${summary.maxRating}`}>{summary.maxAttr}</div>
                  </div>
                </div>
              </div>
            ) : null;
          })()}
          
          {/* 属性表格 - 每个属性单独投骰子 */}
          <table className="character-table attributes-table">
            <tbody>
              <tr>
                <th>力量</th>
                <td className="attribute-cell">
                  {attributesRolled.str ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{str}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('str')}
                        disabled={rollingStates.str || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.str ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('str')}
                      disabled={rollingStates.str}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>敏捷</th>
                <td className="attribute-cell">
                  {attributesRolled.dex ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{dex}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('dex')}
                        disabled={rollingStates.dex || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.dex ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('dex')}
                      disabled={rollingStates.dex}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>智力</th>
                <td className="attribute-cell">
                  {attributesRolled.int ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{int}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('int')}
                        disabled={rollingStates.int || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.int ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('int')}
                      disabled={rollingStates.int}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>体质</th>
                <td className="attribute-cell">
                  {attributesRolled.con ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{con}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('con')}
                        disabled={rollingStates.con || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.con ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('con')}
                      disabled={rollingStates.con}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>外貌</th>
                <td className="attribute-cell">
                  {attributesRolled.app ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{app}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('app')}
                        disabled={rollingStates.app || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.app ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('app')}
                      disabled={rollingStates.app}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>意志</th>
                <td className="attribute-cell">
                  {attributesRolled.pow ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{pow}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('pow')}
                        disabled={rollingStates.pow || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.pow ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('pow')}
                      disabled={rollingStates.pow}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>体型</th>
                <td className="attribute-cell">
                  {attributesRolled.siz ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{siz}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('siz')}
                        disabled={rollingStates.siz || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.siz ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('siz')}
                      disabled={rollingStates.siz}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>教育</th>
                <td className="attribute-cell">
                  {attributesRolled.edu ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{edu}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('edu')}
                        disabled={rollingStates.edu || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.edu ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('edu')}
                      disabled={rollingStates.edu}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>幸运值</th>
                <td className="attribute-cell">
                  {attributesRolled.luck ? (
                    <div className="attribute-display">
                      <span className="attribute-value">{luck}</span>
                      <button 
                        className="mini-dice-button" 
                        onClick={() => rollSingleAttribute('luck')}
                        disabled={rollingStates.luck || totalRollCount >= 3}
                        title={`剩余总重投次数: ${3 - totalRollCount}`}
                      >
                        {rollingStates.luck ? '🎲' : '🔄'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="dice-button" 
                      onClick={() => rollSingleAttribute('luck')}
                      disabled={rollingStates.luck}
                    >
                      🎲
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>生命值</th>
                <td><span className="derived-stat">{hp}</span></td>
              </tr>
              <tr>
                <th>魔法值</th>
                <td><span className="derived-stat">{mp}</span></td>
              </tr>
              <tr>
                <th>理智值</th>
                <td><span className="derived-stat">{san}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="section-separator"></div>
        
        {/* 技能点显示和分配 */}
        <div className="skill-points-section">
          <h3>技能点分配</h3>
          <div className="skill-points-display">
            <div className="points-info">
              <div className="point-type professional">
                <span className="label">职业点:</span>
                <span className="available">{getRemainingSkillPoints().professional}</span>
                <span className="total">/ {skillPoints.professional}</span>
              </div>
              <div className="point-type interest">
                <span className="label">兴趣点:</span>
                <span className="available">{getRemainingSkillPoints().interest}</span>
                <span className="total">/ {skillPoints.interest}</span>
              </div>
              <button 
                type="button" 
                className="reset-all-btn"
                onClick={resetAllSkillAllocations}
                title="重置所有技能分配"
              >
                🔄 重置所有
              </button>
            </div>
          </div>
        </div>
        
        <h3>技能列表</h3>
        
        {/* 桌面端表格布局 */}
        <table className="skills-table">
          <thead>
            <tr>
              <th>技能名称</th>
              <th>初始值</th>
              <th>最终值</th>
              <th>职业点</th>
              <th>兴趣点</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(skillTranslations).map((skillKey) => {
              const allocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
              const initialValue = skillValues[skillKey]?.initial || 0;
              const finalValue = initialValue + allocation.professional + allocation.interest;
              
              return (
                <tr key={skillKey}>
                  <td className="skill-name">{skillTranslations[skillKey]}</td>
                  <td><span className="skill-initial">{initialValue}</span></td>
                  <td><span className="skill-final">{finalValue}</span></td>
                  <td>
                    <div className="allocation-input-group">
                      <input 
                        type="number" 
                        className="allocation-input professional"
                        value={allocation.professional || 0}
                        onChange={(e) => handleSkillAllocation(skillKey, 'professional', e.target.value)}
                        min="0"
                        max="80"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      />
                      <div className="quick-buttons">
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'professional', 5)}>+5</button>
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'professional', 10)}>+10</button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="allocation-input-group">
                      <input 
                        type="number" 
                        className="allocation-input interest"
                        value={allocation.interest || 0}
                        onChange={(e) => handleSkillAllocation(skillKey, 'interest', e.target.value)}
                        min="0"
                        max="70"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      />
                      <div className="quick-buttons">
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'interest', 5)}>+5</button>
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'interest', 10)}>+10</button>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="reset-skill-btn"
                      onClick={() => resetSkillAllocation(skillKey)}
                      title="重置此技能"
                    >
                      🔄
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {/* 移动端卡片布局 */}
        <div className="skills-container">
          {Object.keys(skillTranslations).map((skillKey) => {
            const allocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
            const initialValue = skillValues[skillKey]?.initial || 0;
            const finalValue = initialValue + allocation.professional + allocation.interest;
            
            return (
              <div key={skillKey} className="skill-card-enhanced">
                <div className="skill-card-header">
                  <div className="skill-name">{skillTranslations[skillKey]}</div>
                  <div className="skill-values">
                    <span className="skill-initial">初始: {initialValue}</span>
                    <span className="skill-final">最终: {finalValue}</span>
                  </div>
                  <button 
                    type="button" 
                    className="reset-skill-btn mobile"
                    onClick={() => resetSkillAllocation(skillKey)}
                    title="重置此技能"
                  >
                    🔄
                  </button>
                </div>
                <div className="skill-allocation">
                  <div className="allocation-row">
                    <label className="allocation-label">职业点:</label>
                    <div className="allocation-input-group">
                      <input 
                        type="number" 
                        className="allocation-input professional"
                        value={allocation.professional || 0}
                        onChange={(e) => handleSkillAllocation(skillKey, 'professional', e.target.value)}
                        min="0"
                        max="80"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      />
                      <div className="quick-buttons">
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'professional', 5)}>+5</button>
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'professional', 10)}>+10</button>
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'professional', 20)}>+20</button>
                      </div>
                    </div>
                  </div>
                  <div className="allocation-row">
                    <label className="allocation-label">兴趣点:</label>
                    <div className="allocation-input-group">
                      <input 
                        type="number" 
                        className="allocation-input interest"
                        value={allocation.interest || 0}
                        onChange={(e) => handleSkillAllocation(skillKey, 'interest', e.target.value)}
                        min="0"
                        max="70"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                          }
                        }}
                      />
                      <div className="quick-buttons">
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'interest', 5)}>+5</button>
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'interest', 10)}>+10</button>
                        <button type="button" onClick={() => handleQuickAllocation(skillKey, 'interest', 20)}>+20</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <button type="button" onClick={handleAddSkill}>
          添加技能
        </button>
        <div className="section-separator"></div>
        <h3>背景故事</h3>
        <table className="character-table full-width">
          <tbody>
            <tr>
              <th>个人描述</th>
              <td><textarea value={backgroundStory.personalDescription} onChange={(e) => handleBackgroundChange('personalDescription', e.target.value)} required /></td>
            </tr>
            <tr>
              <th>思想/信仰</th>
              <td><textarea value={backgroundStory.ideologyBeliefs} onChange={(e) => handleBackgroundChange('ideologyBeliefs', e.target.value)} required /></td>
            </tr>
            <tr>
              <th>重要人物</th>
              <td><textarea value={backgroundStory.significantPeople} onChange={(e) => handleBackgroundChange('significantPeople', e.target.value)} required /></td>
            </tr>
            <tr>
              <th>重要地址</th>
              <td><textarea value={backgroundStory.importantLocations} onChange={(e) => handleBackgroundChange('importantLocations', e.target.value)} required /></td>
            </tr>
            <tr>
              <th>贵重物品</th>
              <td><textarea value={backgroundStory.treasuredPossessions} onChange={(e) => handleBackgroundChange('treasuredPossessions', e.target.value)} required /></td>
            </tr>
          </tbody>
        </table>
        <div className="section-separator"></div>
        <h3>随身物品</h3>
        {items.map((item, index) => (
          <div key={index} className="item-record">
            <input
              type="text"
              placeholder="物品名称"
              value={item.name}
              onChange={(e) => handleItemChange(index, 'name', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="物品描述"
              value={item.description}
              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
              required
            />
          </div>
        ))}
        <button type="button" onClick={handleAddItem}>
          添加物品
        </button>
        
        {/* 状态消息显示 */}
        {statusMessage.message && (
          <div className={`status-message ${statusMessage.type}`}>
            {statusMessage.message}
          </div>
        )}
        
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '创建中...' : '提交'}
        </button>
      </form>
      
      {/* 成功模态框 */}
      {showSuccessModal && (
        <div className="success-modal-overlay">
          <div className="success-modal">
            <div className="success-icon">✅</div>
            <h3>角色创建成功！</h3>
            <p>正在跳转到首页...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewPerson;