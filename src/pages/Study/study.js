import React, { useState } from 'react';
import './study.css';
import sampleCharacter from '../sampleCharacter';
import skillTranslations from '../datas/skillTranslations';
import Sidebar from '../Sidebar';

const PersonStudy = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [activeSection, setActiveSection] = useState(null);

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
  };

  const handleAttributeIncrease = (attribute) => {
    setSelectedCharacter((prevCharacter) => ({
      ...prevCharacter,
      [attribute]: prevCharacter[attribute] + 1,
    }));
  };

  const handleSkillIncrease = (skillKey) => {
    setSelectedCharacter((prevCharacter) => ({
      ...prevCharacter,
      skills: {
        ...prevCharacter.skills,
        [skillKey]: {
          ...prevCharacter.skills[skillKey],
          current: prevCharacter.skills[skillKey].current + 1,
        },
      },
    }));
  };

  const handleBackgroundChange = (field, value) => {
    setSelectedCharacter((prevCharacter) => ({
      ...prevCharacter,
      backgroundStory: {
        ...prevCharacter.backgroundStory,
        [field]: value,
      },
    }));
  };

  const handleItemsChange = (index, field, value) => {
    const updatedItems = [...selectedCharacter.items];
    updatedItems[index][field] = value;
    setSelectedCharacter((prevCharacter) => ({
      ...prevCharacter,
      items: updatedItems,
    }));
  };

  const handleSubmit = () => {
    alert('已成功保存更改');
  };

  return (
    <div className="person-study-container">
      <Sidebar />
      <h2>人物学习页面</h2>
      {!selectedCharacter ? (
        <div className="character-selection">
          <h3>选择人物</h3>
          <div className="character-cards">
            {Object.keys(sampleCharacter).map((characterName, index) => (
              <div
                key={index}
                className="character-card"
                onClick={() => handleCharacterSelect(sampleCharacter[characterName])}
              >
                <p>姓名: {sampleCharacter[characterName].name}</p>
                <p>职业: {sampleCharacter[characterName].profession}</p>
                <p>年龄: {sampleCharacter[characterName].age}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="options-section">
          {!activeSection ? (
            <div className="options-menu">
              <button onClick={() => setActiveSection('attributes')}>属性</button>
              <button onClick={() => setActiveSection('skills')}>技能列表</button>
              <button onClick={() => setActiveSection('background')}>背景故事</button>
              <button onClick={() => setActiveSection('items')}>随身物品</button>
            </div>
          ) : (
            <>
              <button className="back-button" onClick={() => setActiveSection(null)}>
                返回
              </button>
              {activeSection === 'attributes' && (
                <div className="section-content">
                  <h3>属性</h3>
                  <table className="character-table">
                    <tbody>
                      {['str', 'dex', 'int', 'con', 'app', 'pow', 'siz', 'edu', 'luck', 'hp', 'mp', 'san'].map((attr) => (
                        <tr key={attr}>
                          <th>{attr.toUpperCase()}</th>
                          <td>{selectedCharacter[attr]}</td>
                          <td>
                            <button onClick={() => handleAttributeIncrease(attr)}>+</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="submit-button" onClick={handleSubmit}>提交</button>
                  <button className="close-button" onClick={() => setActiveSection(null)}>关闭</button>
                </div>
              )}
              {activeSection === 'skills' && (
                <div className="section-content">
                  <h3>技能列表</h3>
                  <table className="skills-table">
                    <tbody>
                      {Object.keys(selectedCharacter.skills).map((skillKey) => (
                        <tr key={skillKey}>
                          <th>{skillTranslations[skillKey]}</th>
                          <td>{selectedCharacter.skills[skillKey].initial}</td>
                          <td>{selectedCharacter.skills[skillKey].current}</td>
                          <td>
                            <button onClick={() => handleSkillIncrease(skillKey)}>+</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="submit-button" onClick={handleSubmit}>提交</button>
                  <button className="close-button" onClick={() => setActiveSection(null)}>关闭</button>
                </div>
              )}
              {activeSection === 'background' && (
                <div className="section-content">
                  <h3>背景故事</h3>
                  <table className="character-table full-width">
                    <tbody>
                      <tr>
                        <th>个人描述</th>
                        <td>
                          <input
                            type="text"
                            value={selectedCharacter.background?.personalDescription || ''}
                            onChange={(e) => handleBackgroundChange('personalDescription', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>思想/信仰</th>
                        <td>
                          <input
                            type="text"
                            value={selectedCharacter.background?.ideologyBeliefs || ''}
                            onChange={(e) => handleBackgroundChange('ideologyBeliefs', e.target.value)}
                          />
                        </td>
                      </tr>
                      <tr>
                        <th>重要人物</th>
                        <td>
                          <input
                            type="text"
                            value={selectedCharacter.background?.significantPeople || ''}
                            onChange={(e) => handleBackgroundChange('significantPeople', e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <button className="submit-button" onClick={handleSubmit}>提交</button>
                  <button className="close-button" onClick={() => setActiveSection(null)}>关闭</button>
                </div>
              )}
              {activeSection === 'items' && (
                <div className="section-content">
                  <h3>随身物品</h3>
                  <table className="character-table full-width">
                    <tbody>
                      {selectedCharacter.weapons?.map((item, index) => (
                        <tr key={index}>
                          <th>物品名称</th>
                          <td>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemsChange(index, 'name', e.target.value)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="submit-button" onClick={handleSubmit}>提交</button>
                  <button className="close-button" onClick={() => setActiveSection(null)}>关闭</button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PersonStudy;
