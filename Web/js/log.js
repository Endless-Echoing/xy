// 登录卡片
function showLoginCard(event) {
    event.preventDefault();
    document.getElementById("loginCard").style.display = "flex";
}


// 点击卡片外部关闭
document.getElementById("loginCard").addEventListener("click", function(e) {
    if (e.target === this) {
       hideLoginCard();
    }
});

document.getElementById('update-time').textContent = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
});


function hideLoginCard() {
    document.getElementById('loginCard').style.display = 'none';
    document.body.style.overflow = 'auto';
    clearMessage();
}

// 清空消息
function clearMessage() {
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = '';
}

// 显示消息
function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = type;
}

// 登录表单提交处理
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const userNum = document.getElementById('userNum').value.trim();
    const password = document.getElementById('password').value;
    const loginBtn = e.target.querySelector('button[type="submit"]');


    if (!userNum) {
        showMessage('请输入学号', 'error');
        document.getElementById('userNum').focus();
        return;
    }

    if (!password) {
        showMessage('请输入密码', 'error');
        document.getElementById('password').focus();
        return;
    }

    // 禁用登录按钮
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';

    try {
        console.log(API.LOGIN);
        // 发送登录请求
        const response = await fetch(API.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userNum,
                password
            })
        });

        const result = await response.json();

        // 处理响应
        if (result.code === 1) {
            showMessage('登录成功！', 'success');
            localStorage.setItem('Token', result.data.token);

            if (window.axios) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${result.data.token}`;
            }

            setTimeout(() => {
                hideLoginCard();
                window.location.href = 'home.html';
            }, 100);

        } else {  // 登录失败
            showMessage(result.msg || '登录失败，请检查学号和密码', 'error');
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }

    } catch (error) {
        console.error('登录出错:', error);
        showMessage('网络错误，请稍后重试', 'error');
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '登录';
    }
});


