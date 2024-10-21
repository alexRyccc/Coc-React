import React, { useState, useEffect } from 'react';
import './newPerson.css';

const skillTranslations = {
  creditRating: "信用评级",
  accounting: "会计",
  anthropology: "人类学",
  appraisal: "估价",
  archaeology: "考古学",
  climb: "攀爬",
  disguise: "乔装",
  dodge: "闪避",
  driveAuto: "汽车驾驶",
  electricalRepair: "电气维修",
  firstAid: "急救",
  history: "历史",
  jump: "跳跃",
  nativeLanguage: "母语(英文)",
  law: "法律",
  libraryUse: "图书馆使用",
  listen: "聆听",
  locksmith: "锁匠",
  mechanicalRepair: "机械维修",
  medicine: "医学",
  naturalWorld: "博物学",
  navigate: "导航",
  occult: "神秘学",
  operateHeavyMachinery: "操作重型机械",
  psychoanalysis: "精神分析",
  psychology: "心理学",
  ride: "骑术",
  sleightOfHand: "妙手",
  spotHidden: "侦查",
  stealth: "潜行",
  swim: "游泳",
  throw: "投掷",
  track: "追踪",
  charm: "魅惑",
  intimidate: "恐吓",
  fastTalk: "话术",
  persuade: "说服",
  artCraft1: "技艺:表演",
  artCraft2: "技艺:美术",
  artCraft3: "技艺:摄影",
  artCraft4: "技艺:伪造文书",
  artCraft5: "技艺:写作",
  artCraft6: "技艺:书法",
  artCraft7: "技艺:音乐",
  artCraft8: "技艺:厨艺",
  artCraft9: "技艺:理发",
  artCraft10: "技艺:木匠",
  artCraft11: "技艺:舞蹈",
  artCraft12: "技艺:莫里斯舞蹈",
  artCraft13: "技艺:歌剧演唱",
  artCraft14: "技艺:粉刷/油漆工",
  artCraft15: "技艺:制陶",
  artCraft16: "技艺:雕塑",
  artCraft17: "技艺:耕作",
  artCraft18: "技艺:制图",
  artCraft19: "技艺:打字",
  artCraft20: "技艺:速记",
  science1: "科学:地质学",
  science2: "科学:化学",
  science3: "科学:生物学",
  science4: "科学:数学",
  science5: "科学:天文学",
  science6: "科学:物理学",
  science7: "科学:药学",
  science8: "科学:植物学",
  science9: "科学:动物学",
  science10: "科学:密码学",
  science11: "科学:工程学",
  science12: "科学:气象学",
  science13: "科学:司法科学",
  science14: "科学:鉴证",
  cthulhuMythos: "克苏鲁神话",
  survival: "生存",
  fighting1: "格斗:斗殴",
  fighting2: "格斗:鞭子",
  fighting3: "格斗:电锯",
  fighting4: "格斗:斧",
  fighting5: "格斗:剑",
  fighting6: "格斗:绞索",
  fighting7: "格斗:链枷",
  fighting8: "格斗:矛",
  firearms1: "射击:步枪/霰弹枪",
  firearms2: "射击:冲锋枪",
  firearms3: "射击:弓",
  firearms4: "射击:火焰喷射器",
  firearms5: "射击:机枪",
  firearms6: "射击:手枪",
  firearms7: "射击:重武器",
  language1: "中文",
  language2: "日语",
  language3: "韩语",
  language4: "俄语",
  language5: "西班牙语",
  language6: "法语",
  language7: "德语",
  language8: "意大利语",
  language9: "葡萄牙语",
  language10: "阿拉伯语",
  language11: "拉丁语",
  language12: "北非语",
  demolitions: "爆破",
  hypnosis: "催眠",
  lipReading: "读唇",
  artillery: "炮术",
  diving: "潜水",
  animalHandling: "驯兽",
  custom1: "自定义1",
  custom2: "自定义2",
  custom3: "自定义3",
  custom4: "自定义4",
  custom5: "自定义5"
};

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
  const [skills, setSkills] = useState([]);  // 修改初始状态为空数组
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
      initial: '',
      current: ''
    }));
    setSkills(initialSkills);
  }, []);

  const handleSkillChange = (index, field, value) => {
    const newSkills = [...skills];
    newSkills[index][field] = value;
    setSkills(newSkills);
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
            </tr>
          </thead>
          <tbody>
            {skills.map((skill, index) => (
              <tr key={index}>
                <td>{skill.name}</td>
                <td><input type="text" value={skill.initial} onChange={(e) => handleSkillChange(index, 'initial', e.target.value)} required /></td>
                <td><input type="text" value={skill.current} onChange={(e) => handleSkillChange(index, 'current', e.target.value)} required /></td>
              </tr>
            ))}
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
