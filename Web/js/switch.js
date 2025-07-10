// 日夜模式切换功能
const modeSwitch = document.querySelector('.switch input');

// 检查本地存储中的模式设置
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    modeSwitch.checked = true;
}

// 切换模式函数
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
    } else {
        localStorage.setItem('darkMode', 'disabled');
    }
}

// 添加事件监听器
modeSwitch.addEventListener('change', toggleDarkMode);