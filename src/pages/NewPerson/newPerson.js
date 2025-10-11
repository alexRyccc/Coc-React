import React, { useState, useEffect } from 'react';
import professionList from './professionList';
import professionSkillMapping from './professionSkillMapping';
import touziGif from './images/touzi.gif';
import { useDispatch, useSelector } from 'react-redux';
import './newPerson.css';
import skillTranslations from '../datas/skillTranslations';
import initialSkillValues from '../datas/initialSkillValues';
import Sidebar from '../Sidebar';
import skillKeyAlias from './skillKeyAlias';

const NewPerson = () => {
  // 深拷贝初始技能，避免状态与常量对象共享引用
  const cloneInitialSkills = () => JSON.parse(JSON.stringify(initialSkillValues));
  const resolveSkillKey = (raw) => {
    if (!raw) return null;
    if (initialSkillValues[raw]) return raw;
    const alias = skillKeyAlias[raw];
    if (alias && initialSkillValues[alias]) return alias;
    return null;
  };
  const dispatch = useDispatch();
  const { isCreatingCharacter, createCharacterError, user } = useSelector(state => state);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
  // 主技能和特长技能
  const [mainSkills, setMainSkills] = useState([]); // 本职技能key
  const [selectedSpecialSkills, setSelectedSpecialSkills] = useState([]); // 选中的特长技能key
  const [mainSkillSelectable, setMainSkillSelectable] = useState([]); // 可选本职技能key（如有“任意一项”）
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
    setSkillValues(cloneInitialSkills());
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

  // 技能分配函数
  const handleSkillAllocation = (skillKey, pointType, value) => {
    const currentAllocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
    const remaining = getRemainingSkillPoints();
    const initialValue = initialSkillValues[skillKey]?.initial || 0;
    const newValue = Math.max(0, parseInt(value) || 0);
    const oldValue = currentAllocation[pointType] || 0;
    const valueDifference = newValue - oldValue;
    // 规则：本职技能可用职业点或兴趣点；非本职技能仅可用兴趣点
    const isMain = mainSkills.includes(skillKey);
    if (!isMain && pointType === 'professional') return;
    if (valueDifference > 0 && remaining[pointType] < valueDifference) {
      setStatusMessage({ type: 'error', message: `${pointType === 'professional' ? '职业' : '兴趣'}点不足！剩余${remaining[pointType]}点` });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }
    const otherTypeValue = currentAllocation[pointType === 'professional' ? 'interest' : 'professional'] || 0;
    const finalValue = initialValue + newValue + otherTypeValue;
    // 上限：最终值不超过 80
    if (finalValue > 80) {
      setStatusMessage({ type: 'error', message: '技能值最高只能到80！' });
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
      return;
    }
    const newAllocation = {
      ...currentAllocation,
      [pointType]: newValue
    };
    setSkillAllocation(prev => ({
      ...prev,
      [skillKey]: newAllocation
    }));
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
    setSkillValues(cloneInitialSkills());
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
  };

  // 监听职业变化，动态更新本职技能和可选技能
  // 修正职业技能映射和特长选择逻辑
  // 修复：本职技能显示逻辑，特长技能选择后mainSkills实时更新
  useEffect(() => {
    if (profession && professionSkillMapping[profession]) {
      const rawMapping = professionSkillMapping[profession];
      // 统计 special 占位数量
      const specialCount = rawMapping.filter(k => k.startsWith('special')).length;
      // 解析映射并做别名转换，使用 resolveSkillKey 保证落到合法 key
      const allSkillKeys = Object.keys(skillTranslations).filter(k => initialSkillValues[k]);
      const baseSkills = [];
      const unknownKeys = [];
      rawMapping
        .filter(k => !k.startsWith('special'))
        .forEach(k => {
          const mapped = resolveSkillKey(k);
          if (mapped && allSkillKeys.includes(mapped)) {
            if (!baseSkills.includes(mapped)) baseSkills.push(mapped);
          } else {
            unknownKeys.push(k);
          }
        });
      if (unknownKeys.length > 0) {
        // 控制台提示开发者（不会打扰用户界面）
        console.warn('[职业技能映射] 以下技能key不存在或无法映射，已忽略: ', unknownKeys.join(', '));
      }
      // 可选特长技能池（包含全部技能，已是基础本职的禁用显示，便于查看全集）
      let selectable = [];
      if (specialCount > 0) {
        selectable = allSkillKeys.slice();
        // 排序：按中文名称（或 key）排序，便于查找
        selectable.sort((a, b) => (skillTranslations[a] || a).localeCompare(skillTranslations[b] || b, 'zh-Hans-CN'));
      }
      setMainSkillSelectable(selectable);
  // 自动修剪现有特长选择：排除已是基础本职的技能，且限制在候选池和上限内
  let newSpecial = selectedSpecialSkills.filter(k => selectable.includes(k) && !baseSkills.includes(k));
      if (newSpecial.length > specialCount) newSpecial = newSpecial.slice(0, specialCount);
      setSelectedSpecialSkills(newSpecial);
      // 重置点数 & 技能数值
      setSkillAllocation({});
      setSkillValues(cloneInitialSkills());
      setMainSkills([...baseSkills, ...newSpecial]);
    } else if (profession === '自定义职业' && customProfession) {
      setMainSkills([]);
      setMainSkillSelectable([]);
      setSelectedSpecialSkills([]);
      setSkillAllocation({});
      setSkillValues(cloneInitialSkills());
    } else {
      setMainSkills([]);
      setMainSkillSelectable([]);
      setSelectedSpecialSkills([]);
      setSkillAllocation({});
      setSkillValues(cloneInitialSkills());
    }
  }, [profession, customProfession]);

  // 监听selectedSpecialSkills变化，mainSkills实时更新
  useEffect(() => {
    if (profession && professionSkillMapping[profession]) {
      const rawMapping = professionSkillMapping[profession];
      const allSkillKeys = Object.keys(skillTranslations).filter(k => initialSkillValues[k]);
      const baseSkills = [];
      rawMapping
        .filter(k => !k.startsWith('special'))
        .forEach(k => {
          const mapped = resolveSkillKey(k);
          if (mapped && allSkillKeys.includes(mapped) && !baseSkills.includes(mapped)) baseSkills.push(mapped);
        });
      setMainSkills([...baseSkills, ...selectedSpecialSkills]);
    }
  }, [selectedSpecialSkills, profession]);

  // 当 mainSkills 变化时，自动修正分配：
  // - 变为非本职：清零其职业点（非本职不可用职业点）
  useEffect(() => {
    if (!skillAllocation) return;
    const updated = { ...skillAllocation };
    let changed = false;
    const becameNonMain = [];
    Object.keys(updated).forEach((key) => {
      const isMain = mainSkills.includes(key);
      const alloc = updated[key] || { professional: 0, interest: 0 };
      if (!isMain && (alloc.professional || 0) > 0) {
        updated[key] = { ...alloc, professional: 0 };
        changed = true;
        becameNonMain.push(key);
      }
    });
    if (changed) {
      setSkillAllocation(updated);
      // 同步刷新技能当前值
      const newSkillValues = cloneInitialSkills();
      Object.keys(updated).forEach(key => {
        const allocation = updated[key] || { professional: 0, interest: 0 };
        const initialValue = newSkillValues[key]?.initial || 0;
        const newVal = initialValue + (allocation.professional || 0) + (allocation.interest || 0);
        if (newSkillValues[key]) newSkillValues[key].current = newVal;
      });
      setSkillValues(newSkillValues);
      // 提示用户发生了自动纠正
      if (becameNonMain.length) {
        setStatusMessage({ type: 'info', message: `以下技能已变为非本职，已清零职业点：${becameNonMain.map(k => skillTranslations[k] || k).join('、')}` });
      }
      setTimeout(() => setStatusMessage({ type: '', message: '' }), 3000);
    }
  }, [mainSkills]);

  return (
    <div className="new-person-container">
      <Sidebar />
      <h2>创建新角色</h2>
      
      {/* 中央大骰子动画 */}
      {showGiantDice && (
        <div className="central-dice-overlay" style={{background:'rgba(10,20,30,0.92)'}}>
          <img src={touziGif} alt="骰子动画" style={{width: 120, height: 120, borderRadius: 20, boxShadow: '0 0 30px #00e0ff, 0 0 60px #0ff', border: '3px solid #00e0ff'}} />
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <h3>基本信息</h3>
        <div className="character-tables" style={{marginBottom: 0}}>
          <table className="character-table" style={{marginBottom: 0, borderRadius: 16, overflow: 'hidden'}}>
            <tbody>
              <tr style={{background: 'linear-gradient(90deg,#0f2027 0%,#2c5364 100%)'}}>
                <th>姓名</th>
                <td><input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff'}} /></td>
              </tr>
              <tr style={{background: 'linear-gradient(90deg,#232526 0%,#414345 100%)'}}>
                <th>年龄</th>
                <td><input type="text" value={age} onChange={(e) => setAge(e.target.value)} required style={{fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff'}} /></td>
              </tr>
              <tr style={{background: 'linear-gradient(90deg,#0f2027 0%,#2c5364 100%)'}}>
                <th>职业</th>
                <td>
                  <div style={{display:'flex',flexDirection:'column',width:'100%'}}>
                    <div>
                      <select
                        value={profession}
                        onChange={e => setProfession(e.target.value)}
                        style={{ fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff', width: profession==='自定义职业' ? '70%' : '100%' }}
                      >
                        {professionList.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                      {profession === '自定义职业' && (
                        <input
                          type="text"
                          value={customProfession}
                          onChange={e => setCustomProfession(e.target.value)}
                          placeholder="输入自定义职业"
                          style={{ fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff', marginLeft: 8, width: '28%' }}
                        />
                      )}
                    </div>
                    {profession && (mainSkills.length > 0 || (professionSkillMapping[profession]?.some(k => k.startsWith('special')))) && (
                      <div className="main-skills-section parchment-box" style={{margin:'12px 0 4px',background:'#f5ecd7',borderRadius:14,boxShadow:'0 1px 6px #d2c7a3',padding:'10px 10px'}}>
                        <div style={{color:'#1a4d1a',fontWeight:700,fontSize:16,marginBottom:6,letterSpacing:1}}>本职技能</div>
                        <div style={{display:'flex',flexWrap:'wrap',gap:8,marginBottom:mainSkillSelectable.length>0?8:0}}>
                          {mainSkills.map(skillKey => (
                            <span key={skillKey} style={{display:'inline-flex',alignItems:'center',background:'#fff',borderRadius:8,padding:'4px 10px',color:'#1a4d1a',fontWeight:600,border:'1px solid #d2c7a3',fontSize:13}}>
                              <input type="radio" checked disabled style={{marginRight:4,accentColor:'#1a4d1a'}} />
                              {skillTranslations[skillKey] || skillKey}
                            </span>
                          ))}
                        </div>
                        {mainSkillSelectable.length > 0 && (
                          <div style={{marginTop:4}}>
                            <span style={{color:'#1a4d1a',fontWeight:600,fontSize:13}}>可额外选择特长（最多{professionSkillMapping[profession]?.filter(k=>k.startsWith('special')).length}项）:</span>
                            <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:6}}>
                              {mainSkillSelectable.map(skillKey => {
                                const isBaseMain = (() => {
                                  const rawMapping = professionSkillMapping[profession] || [];
                                  const allSkillKeys = Object.keys(skillTranslations).filter(k => initialSkillValues[k]);
                                  const base = [];
                                  rawMapping.filter(k=>!k.startsWith('special')).forEach(k=>{
                                    const mapped = resolveSkillKey(k);
                                    if (mapped && allSkillKeys.includes(mapped) && !base.includes(mapped)) base.push(mapped);
                                  });
                                  return base.includes(skillKey);
                                })();
                                const disabledByMax = selectedSpecialSkills.length >= (professionSkillMapping[profession]?.filter(k=>k.startsWith('special')).length || 0) && !selectedSpecialSkills.includes(skillKey);
                                const disabled = isBaseMain || disabledByMax;
                                return (
                                <label key={skillKey} style={{display:'flex',alignItems:'center',background:'#fff',borderRadius:8,padding:'4px 8px',color: disabled?'#999':'#222',fontWeight:500,border:'1px solid #d2c7a3',fontSize:12, opacity: disabled?0.7:1}}>
                                  <input
                                    type="checkbox"
                                    checked={selectedSpecialSkills.includes(skillKey)}
                                    onChange={e => {
                                      let newArr = [...selectedSpecialSkills];
                                      const maxCount = professionSkillMapping[profession]?.filter(k=>k.startsWith('special')).length || 0;
                                      if (e.target.checked) {
                                        if (newArr.length < maxCount) {
                                          newArr.push(skillKey);
                                        } else {
                                          // 反馈超过上限
                                          setStatusMessage({ type: 'error', message: `最多可选择${maxCount}项特长` });
                                          setTimeout(() => setStatusMessage({ type: '', message: '' }), 2000);
                                        }
                                      } else {
                                        newArr = newArr.filter(k => k !== skillKey);
                                      }
                                      setSelectedSpecialSkills(newArr);
                                    }}
                                    disabled={disabled}
                                    style={{marginRight:4,accentColor:'#1a4d1a'}}
                                  />
                                  {skillTranslations[skillKey] || skillKey}
                                  {isBaseMain && (<span style={{marginLeft:6,color:'#1a4d1a',fontSize:11,fontWeight:600}}>（本职）</span>)}
                                </label>
                              )})}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
              <tr style={{background: 'linear-gradient(90deg,#232526 0%,#414345 100%)'}}>
                <th>性别</th>
                <td><input type="text" value={gender} onChange={(e) => setGender(e.target.value)} required style={{fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff'}} /></td>
              </tr>
              <tr style={{background: 'linear-gradient(90deg,#0f2027 0%,#2c5364 100%)'}}>
                <th>现居地</th>
                <td><input type="text" value={currentResidence} onChange={(e) => setCurrentResidence(e.target.value)} required style={{fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff'}} /></td>
              </tr>
              <tr style={{background: 'linear-gradient(90deg,#232526 0%,#414345 100%)'}}>
                <th>出生地</th>
                <td><input type="text" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} required style={{fontSize: 17, background: 'rgba(0,255,255,0.08)', color: '#0ff'}} /></td>
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
          <table className="character-table attributes-table" style={{marginTop: 0, borderRadius: 16, overflow: 'hidden'}}>
            <tbody>
              {[
                { key: 'str', label: '力量', value: str, rolling: rollingStates.str, rolled: attributesRolled.str },
                { key: 'dex', label: '敏捷', value: dex, rolling: rollingStates.dex, rolled: attributesRolled.dex },
                { key: 'int', label: '智力', value: int, rolling: rollingStates.int, rolled: attributesRolled.int },
                { key: 'con', label: '体质', value: con, rolling: rollingStates.con, rolled: attributesRolled.con },
                { key: 'app', label: '外貌', value: app, rolling: rollingStates.app, rolled: attributesRolled.app },
                { key: 'pow', label: '意志', value: pow, rolling: rollingStates.pow, rolled: attributesRolled.pow },
                { key: 'siz', label: '体型', value: siz, rolling: rollingStates.siz, rolled: attributesRolled.siz },
                { key: 'edu', label: '教育', value: edu, rolling: rollingStates.edu, rolled: attributesRolled.edu },
                { key: 'luck', label: '幸运值', value: luck, rolling: rollingStates.luck, rolled: attributesRolled.luck },
              ].map((attr, idx) => (
                <tr key={attr.key} style={{background: idx % 2 === 0 ? 'linear-gradient(90deg,#232526 0%,#0f2027 100%)' : 'linear-gradient(90deg,#232526 0%,#414345 100%)'}}>
                  <th style={{color:'#0ff', fontWeight:700, fontSize:15}}>{attr.label}</th>
                  <td className="attribute-cell" style={{padding:'8px 4px'}}>
                    {attr.rolled ? (
                      <div className="attribute-display" style={{gap:6}}>
                        <span className="attribute-value" style={{fontSize:18, color:'#000607ff', background:'rgba(0,255,255,0.08)'}}>{attr.value}</span>
                        <button 
                          className="mini-dice-button" 
                          style={{width:32, height:32, fontSize:13, background:'linear-gradient(135deg,#00e0ff,#00b894)', color:'#fff'}} 
                          onClick={() => rollSingleAttribute(attr.key)}
                          disabled={attr.rolling || totalRollCount >= 3}
                          title={`剩余总重投次数: ${3 - totalRollCount}`}
                        >
                          {attr.rolling ? <img src={touziGif} alt="骰子" style={{width:20, height:20}} /> : '🔄'}
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="dice-button" 
                        style={{width:40, height:40, fontSize:18, background:'linear-gradient(135deg,#00e0ff,#00b894)', color:'#fff'}} 
                        onClick={() => rollSingleAttribute(attr.key)}
                        disabled={attr.rolling}
                      >
                        {attr.rolling ? <img src={touziGif} alt="骰子" style={{width:20, height:20}} /> : '🎲'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr style={{background:'linear-gradient(90deg,#0f2027 0%,#2c5364 100%)'}}>
                <th style={{color:'#0ff'}}>生命值</th>
                <td><span className="derived-stat" style={{fontSize:16, color:'#00e0ff', background:'rgba(0,255,255,0.08)'}}>{hp}</span></td>
              </tr>
              <tr style={{background:'linear-gradient(90deg,#232526 0%,#414345 100%)'}}>
                <th style={{color:'#0ff'}}>魔法值</th>
                <td><span className="derived-stat" style={{fontSize:16, color:'#00e0ff', background:'rgba(0,255,255,0.08)'}}>{mp}</span></td>
              </tr>
              <tr style={{background:'linear-gradient(90deg,#0f2027 0%,#2c5364 100%)'}}>
                <th style={{color:'#0ff'}}>理智值</th>
                <td><span className="derived-stat" style={{fontSize:16, color:'#00e0ff', background:'rgba(0,255,255,0.08)'}}>{san}</span></td>
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
          <div style={{color:'#0ff',fontSize:13,marginTop:4}}>
            本职技能可使用职业点或兴趣点；非本职技能只能使用兴趣点。
          </div>
        </div>
        
        <h3>技能列表</h3>
        
        {/* 羊皮纸风格技能列表，单列适配移动端，每行一个技能，主技能有单选框标识，黑/深绿字色 */}
        <div className="skills-container parchment-skill-list" style={{background:'#f5ecd7', borderRadius:18, boxShadow:'0 2px 12px #d2c7a3', padding:'18px 8px', margin:'16px 0', display:'flex', flexDirection:'column', gap:10}}>
          {Object.keys(skillTranslations).map((skillKey) => {
            const allocation = skillAllocation[skillKey] || { professional: 0, interest: 0 };
            const initialValue = skillValues[skillKey]?.initial || 0;
            const finalValue = initialValue + allocation.professional + allocation.interest;
            const isMain = mainSkills.includes(skillKey);
            return (
              <div key={skillKey} className="parchment-skill-row" style={{display:'flex',alignItems:'center',background:'#fff',borderRadius:12,padding:'8px 6px',boxShadow:'0 1px 4px #e0e6ed',marginBottom:2,flexWrap:'wrap',border:'1px solid #d2c7a3'}}>
                {/* 单选框标识职业技能 */}
                <input
                  type="radio"
                  checked={isMain}
                  readOnly
                  style={{marginRight:8,accentColor:'#1a4d1a',width:18,height:18}}
                  tabIndex={-1}
                  aria-label={isMain ? '职业技能' : '非职业技能'}
                />
                <span style={{fontWeight:700,fontSize:15,color:isMain?'#1a4d1a':'#222',minWidth:90,flex:'1 1 120px'}}>{skillTranslations[skillKey]}</span>
                <span style={{color:'#222',marginLeft:8,fontSize:13}}>初始:<b>{initialValue}</b></span>
                <span style={{color:'#222',marginLeft:8,fontSize:13}}>最终:<b>{finalValue}</b></span>
                <label style={{fontSize:13,color:'#1a4d1a',marginLeft:8}}>职业点</label>
                <input
                  type="number"
                  className="allocation-input professional"
                  value={allocation.professional || 0}
                  onChange={(e) => handleSkillAllocation(skillKey, 'professional', e.target.value)}
                  min="0"
                  max="80"
                  disabled={!isMain}
                  style={{background:!isMain?'#f5ecd7':'#fff',color:!isMain?'#bbb':'#1a4d1a',border:'1px solid #d2c7a3',borderRadius:6,padding:'2px 8px',width:50,marginLeft:4}}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                <label style={{fontSize:13,color:'#222',marginLeft:8}}>兴趣点</label>
                <input
                  type="number"
                  className="allocation-input interest"
                  value={allocation.interest || 0}
                  onChange={(e) => handleSkillAllocation(skillKey, 'interest', e.target.value)}
                  min="0"
                  max="70"
                  disabled={false}
                  style={{background:isMain?'#f5ecd7':'#fff',color:isMain?'#bbb':'#1a4d1a',border:'1px solid #d2c7a3',borderRadius:6,padding:'2px 8px',width:50,marginLeft:4}}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                />
                <button
                  type="button"
                  className="reset-skill-btn"
                  onClick={() => resetSkillAllocation(skillKey)}
                  title="重置此技能"
                  style={{marginLeft:8,background:'#f5ecd7',border:'none',borderRadius:6,padding:'2px 8px',color:'#888',cursor:'pointer'}}
                >
                  🔄
                </button>
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