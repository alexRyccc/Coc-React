import React, { useState, useEffect } from 'react';
import './newPerson.css';
import skillTranslations from '../datas/skillTranslations';
import initialSkillValues from '../datas/initialSkillValues';
import Sidebar from '../Sidebar';

const NewPerson = () => {
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
  const [skills, setSkills] = useState([{ name: '', initial: '', current: '' }]);
  const [backgroundStory, setBackgroundStory] = useState({
    personalDescription: '',
    ideologyBeliefs: '',
    significantPeople: '',
    importantLocations: '',
    treasuredPossessions: ''
  });
  const [items, setItems] = useState([{ name: '', description: '' }]);
  const [history, setHistory] = useState([{ time: '', event: '' }]);

  // 当组件加载时，将技能表格初始化
  useEffect(() => {
    const initialSkills = Object.keys(skillTranslations).map(skillKey => ({
      name: skillTranslations[skillKey],
      initial: initialSkillValues[skillKey]?.initial || '',
      current: initialSkillValues[skillKey]?.current || ''
    }));
    setSkills(initialSkills);
  }, []);


  const handleSkillChange = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
  };

  const handleAddSkill = () => {
    setSkills([...skills, { name: '', initial: '', current: '' }]);
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
    // 处理提交逻辑，例如将数据发送到服务器
    console.log({
      name,
      age,
      profession,
      gender,
      currentResidence,
      birthplace,
      str,
      dex,
      int,
      con,
      app,
      pow,
      siz,
      edu,
      luck,
      hp,
      mp,
      san,
      skills,
      backgroundStory,
      items,
      history
    });
  };

  return (
    <div className="new-person-container">
          <Sidebar />
      <h2>创建新角色</h2>
      <form onSubmit={handleSubmit}>
        <h3>基本信息</h3>
        <div className="character-tables">
          <table className="character-table">
            <tbody>
              <tr>
                <th>姓名</th>
                <td><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></td>
                <th>年龄</th>
                <td><input type="text" value={age} onChange={(e) => setAge(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>职业</th>
                <td><input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} required /></td>
                <th>性别</th>
                <td><input type="text" value={gender} onChange={(e) => setGender(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>现居地</th>
                <td><input type="text" value={currentResidence} onChange={(e) => setCurrentResidence(e.target.value)} required /></td>
                <th>出生地</th>
                <td><input type="text" value={birthplace} onChange={(e) => setBirthplace(e.target.value)} required /></td>
              </tr>
            </tbody>
          </table>
          <table className="character-table">
            <tbody>
              <tr>
                <th>力量</th>
                <td><input type="text" value={str} onChange={(e) => setStr(e.target.value)} required /></td>
                <th>敏捷</th>
                <td><input type="text" value={dex} onChange={(e) => setDex(e.target.value)} required /></td>
                <th>智力</th>
                <td><input type="text" value={int} onChange={(e) => setInt(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>体质</th>
                <td><input type="text" value={con} onChange={(e) => setCon(e.target.value)} required /></td>
                <th>外貌</th>
                <td><input type="text" value={app} onChange={(e) => setApp(e.target.value)} required /></td>
                <th>意志</th>
                <td><input type="text" value={pow} onChange={(e) => setPow(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>体型</th>
                <td><input type="text" value={siz} onChange={(e) => setSiz(e.target.value)} required /></td>
                <th>教育</th>
                <td><input type="text" value={edu} onChange={(e) => setEdu(e.target.value)} required /></td>
                <th>幸运值</th>
                <td><input type="text" value={luck} onChange={(e) => setLuck(e.target.value)} required /></td>
              </tr>
              <tr>
                <th>生命值</th>
                <td><input type="text" value={hp} onChange={(e) => setHp(e.target.value)} required /></td>
                <th>魔法值</th>
                <td><input type="text" value={mp} onChange={(e) => setMp(e.target.value)} required /></td>
                <th>理智值</th>
                <td><input type="text" value={san} onChange={(e) => setSan(e.target.value)} required /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="section-separator"></div>
        <h3>技能列表</h3>
        <table className="skills-table">
          <thead>
            <tr>
              <th>技能名称</th>
              <th>初始值</th>
              <th>现有值</th>
              <th></th>
              <th>技能名称</th>
              <th>初始值</th>
              <th>现有值</th>
              <th></th>
              <th>技能名称</th>
              <th>初始值</th>
              <th>现有值</th>
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => {
              if (index % 3 === 0) {
                return (
                  <tr key={index}>
                    <td><input
                      type="text"
                      className="skill-input"
                      value={skills[index]?.name || ''}
                      onChange={(e) => handleSkillChange(index, 'name', e.target.value)}
                      placeholder="Enter skill"
                    /></td>
                    <td><input type="text" className="skill-value" value={skills[index]?.initial || ''} onChange={(e) => handleSkillChange(index, 'initial', e.target.value)} required /></td>
                    <td><input type="text" className="skill-value" value={skills[index]?.current || ''} onChange={(e) => handleSkillChange(index, 'current', e.target.value)} required /></td>
                    <td></td>
                    <td><input
                      type="text"
                      className="skill-input"
                      value={skills[index + 1]?.name || ''}
                      onChange={(e) => handleSkillChange(index + 1, 'name', e.target.value)}
                      placeholder="Enter skill"
                    /></td>
                    <td><input type="text" className="skill-value" value={skills[index + 1]?.initial || ''} onChange={(e) => handleSkillChange(index + 1, 'initial', e.target.value)} required /></td>
                    <td><input type="text" className="skill-value" value={skills[index + 1]?.current || ''} onChange={(e) => handleSkillChange(index + 1, 'current', e.target.value)} required /></td>
                    <td></td>
                    <td><input
                      type="text"
                      className="skill-input"
                      value={skills[index + 2]?.name || ''}
                      onChange={(e) => handleSkillChange(index + 2, 'name', e.target.value)}
                      placeholder="Enter skill"
                    /></td>
                    <td><input type="text" className="skill-value" value={skills[index + 2]?.initial || ''} onChange={(e) => handleSkillChange(index + 2, 'initial', e.target.value)} required /></td>
                    <td><input type="text" className="skill-value" value={skills[index + 2]?.current || ''} onChange={(e) => handleSkillChange(index + 2, 'current', e.target.value)} required /></td>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
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
        <div className="section-separator"></div>
        <h3>跑团记录</h3>
        {history.map((record, index) => (
          <div key={index} className="history-record">
            <input
              type="text"
              placeholder="时间"
              value={record.time}
              onChange={(e) => handleHistoryChange(index, 'time', e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="事件"
              value={record.event}
              onChange={(e) => handleHistoryChange(index, 'event', e.target.value)}
              required
            />
          </div>
        ))}
        <button type="button" onClick={handleAddHistory}>
          添加记录
        </button>
        <button type="submit">提交</button>
      </form>
    </div>
  );
};

export default NewPerson;