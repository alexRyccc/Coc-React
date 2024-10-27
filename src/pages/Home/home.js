import React, { useState } from 'react';
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
  const [hoveredCharacter, setHoveredCharacter] = useState(null);

  const characters = sampleCharacters; // Use sampleCharacters array

  const handleScroll = (event) => {
    setRotation(rotation + event.deltaY * 0.2);
  };

  const handleCardClick = (character) => {
    setSelectedCharacter(character);
  };

  const handleClose = () => {
    setSelectedCharacter(null);
  };

  const handleMouseEnter = (character, index) => {
    setHoveredCharacter(character);
    setRotation(-index * (360 / characters.length));
  };

  const handleMouseLeave = () => {
    setHoveredCharacter(null);
  };

  return (
    <div>
    <Sidebar />
    <div className="character-container" onWheel={handleScroll} style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="carousel">
        {characters.map((character, index) => {
          const characterClass = getCharacterClass(character);

          return (
            <div
              key={index}
              className={`character-card ${characterClass} ${hoveredCharacter === character ? 'hovered' : ''}`}
              onClick={() => handleCardClick(character)}
              onMouseEnter={() => handleMouseEnter(character, index)}
              onMouseLeave={handleMouseLeave}
            >
              <img src={getCharacterImage(character)} alt={`${character.name}'s image`} className="character-image" />
              <div className="character-info">
                <h3>{character.name}</h3>
                <p>年龄: {character.age}</p>
                <p>职业: {character.profession}</p>
                <p>性别: {character.gender}</p>
                {/* <p>现居地: {character.currentResidence}</p>
                <p>出生地: {character.birthplace}</p> */}
                {/* <div className="character-attributes">
                  <table className="attribute-table">
                    <tbody>
                      <tr><th>力量</th><td>{character.str}</td><th>敏捷</th><td>{character.dex}</td><th>智力</th><td>{character.int}</td></tr>
                      <tr><th>体质</th><td>{character.con}</td><th>外貌</th><td>{character.app}</td><th>意志</th><td>{character.pow}</td></tr>
                      <tr><th>体型</th><td>{character.siz}</td><th>教育</th><td>{character.edu}</td><th>生命值</th><td>{character.hp}</td></tr>
                      <tr><th>魔法值</th><td>{character.mp}</td><th>理智值</th><td>{character.san}</td><th>幸运值</th><td>{character.luck}</td></tr>
                    </tbody>
                  </table>
                </div> */}
              </div>
            </div>
          );
        })}
      </div>


      {selectedCharacter && (
        <div className="overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedCharacter.name}</h2>
            <img src={getCharacterImage(selectedCharacter)} alt={`${selectedCharacter.name}'s image`} className="character-avatar" />
            <div className="character-details">
              <h5>点击列表外任意位置退出</h5>
              <h3>基本信息</h3>
              <div className="character-tables">
                <table className="character-table">
                  <tbody>
                    <tr><th>姓名</th><td>{selectedCharacter.name}</td><th>年龄</th><td>{selectedCharacter.age}</td></tr>
                    <tr><th>职业</th><td>{selectedCharacter.profession}</td><th>性别</th><td>{selectedCharacter.gender}</td></tr>
                    <tr><th>现居地</th><td>{selectedCharacter.currentResidence}</td><th>出生地</th><td>{selectedCharacter.birthplace}</td></tr>
                  </tbody>
                </table>
                <table className="character-table">
                  <tbody>
                    <tr><th>力量</th><td>{selectedCharacter.str}</td><th>敏捷</th><td>{selectedCharacter.dex}</td><th>智力</th><td>{selectedCharacter.int}</td></tr>
                    <tr><th>体质</th><td>{selectedCharacter.con}</td><th>外貌</th><td>{selectedCharacter.app}</td><th>意志</th><td>{selectedCharacter.pow}</td></tr>
                    <tr><th>体型</th><td>{selectedCharacter.siz}</td><th>教育</th><td>{selectedCharacter.edu}</td><th>幸运值</th><td>{selectedCharacter.luck}</td></tr>
                    <tr><th>生命值</th><td>{selectedCharacter.hp}</td><th>魔法值</th><td>{selectedCharacter.mp}</td><th>理智值</th><td>{selectedCharacter.san}</td></tr>
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
                    <th>技能名称</th>
                    <th>初始值</th>
                    <th>现有值</th>
                    <th>技能名称</th>
                    <th>初始值</th>
                    <th>现有值</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(selectedCharacter.skills).reduce((rows, [skill, values], index, array) => {
                    if (index % 3 === 0) {
                      rows.push(array.slice(index, index + 3));
                    }
                    return rows;
                  }, []).map((skillSet, rowIndex) => (
                    <tr key={rowIndex}>
                      {skillSet.map(([skill, values]) => (
                        <React.Fragment key={skill}>
                          <td>{skillTranslations[skill]}</td>
                          <td>{values.initial}</td>
                          <td>{values.current}</td>
                        </React.Fragment>
                      ))}
                      {skillSet.length < 3 && Array.from({ length: 3 - skillSet.length }).map((_, i) => (
                        <React.Fragment key={`empty-${i}`}>
                          <td></td>
                          <td></td>
                          <td></td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="section-separator"></div>
              <h3>背景故事</h3>
              <table className="character-table full-width">
                <tbody>
                  <tr><th>个人描述</th><td>{selectedCharacter.background.personalDescription}</td></tr>
                  <tr><th>思想/信仰</th><td>{selectedCharacter.background.ideologyBeliefs}</td></tr>
                  <tr><th>重要人物</th><td>{selectedCharacter.background.significantPeople}</td></tr>
                  <tr><th>重要地址</th><td>{selectedCharacter.background.importantLocations}</td></tr>
                  <tr><th>贵重物品</th><td>{selectedCharacter.background.treasuredPossessions}</td></tr>
                </tbody>
              </table>
              <div className="section-separator"></div>
              <h3>随身物品</h3>
              <table className="character-table">
                <tbody>
                  <tr><th>物品1</th><td>描述1</td></tr>
                  <tr><th>物品2</th><td>描述2</td></tr>
                  <tr><th>物品3</th><td>描述3</td></tr>
                </tbody>
              </table>
              <div className="section-separator"></div>
              <h3>资财</h3>
              <table className="character-table">
                <tbody>
                  <tr><th>现金</th><td>18.00</td></tr>
                  <tr><th>资产</th><td>450.00</td></tr>
                  <tr><th>消费水平</th><td>10.00</td></tr>
                </tbody>
              </table>
            </div>
            <button onClick={handleClose}>关闭</button>
          </div>
        </div>
        
      )}
       </div>
    </div>
    
  );
 
    

};

export default Home;