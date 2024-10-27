import React, { useState } from 'react';
import sampleCharacters from '../sampleCharacter';
import './achievements.css';
import Sidebar from '../Sidebar';

const Achievements = () => {
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleCharacterSelect = (character) => {
    setSelectedCharacter(character);
  };

  return (
    <div className="achievements-container">
      <Sidebar />
      <h2>角色称号展示</h2>
      {!selectedCharacter ? (
        <div className="character-selection">
          <h3>选择人物</h3>
          <div className="character-cards">
            {Object.keys(sampleCharacters).map((characterName, index) => (
              <div
                key={index}
                className="character-card"
                onClick={() => handleCharacterSelect(sampleCharacters[characterName])}
              >
                <p>姓名: {sampleCharacters[characterName].name}</p>
                <p>职业: {sampleCharacters[characterName].profession}</p>
                <p>年龄: {sampleCharacters[characterName].age}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="character-details">
          <h3>{selectedCharacter.name}的称号</h3>
          <table className="achievements-table">
            <thead>
              <tr>
                <th>称号</th>
                <th>描述</th>
              </tr>
            </thead>
            <tbody>
              {selectedCharacter.achievements.map((achievement, index) => (
                <tr key={index}>
                  <td>{achievement.title}</td>
                  <td>{achievement.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Achievements;