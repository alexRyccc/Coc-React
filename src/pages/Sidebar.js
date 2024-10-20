import React from 'react';
import './Sidebar.css'; // 假设 CSS 文件在同一目录下

const Sidebar = () => {
  const handleNavigation = (path) => {
    sessionStorage.setItem('historyPageRefreshed', 'false'); // 重置刷新标志
    window.location.href = `/#${path}`;
  };

  return (
    <div className="sidebar">
      <ul>
        <li onClick={() => handleNavigation('/home')} className="sidebar-button">我的人物</li>
        <li onClick={() => handleNavigation('/history')} className="sidebar-button">跑团历史</li>
        <li onClick={() => handleNavigation('/add-character')} className="sidebar-button">新增角色</li>
        <li onClick={() => handleNavigation('/character-learning')} className="sidebar-button">人物学习</li>
      </ul>
    </div>
  );
};

export default Sidebar;