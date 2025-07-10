// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 从后端获取用户数据
    fetchUserData();

    // 导航栏滚动效果
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 10) {
            navbar.classList.add('shadow-md');
        } else {
            navbar.classList.remove('shadow-md');
        }
    });



    // 编辑资料按钮点击事件
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const editModal = document.getElementById('edit-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModal = document.getElementById('close-modal');
    const cancelEdit = document.getElementById('cancel-edit');

    editProfileBtn.addEventListener('click', function() {
        // 填充表单数据
        document.getElementById('edit-name').value = document.getElementById('profile-name').textContent;
        document.getElementById('edit-gender').value = document.getElementById('gender').textContent === '男' ? 'M' : document.getElementById('gender').textContent === '女' ? 'F' : 'O';
        document.getElementById('edit-age').value = document.getElementById('age').textContent.replace('岁', '');
        document.getElementById('edit-college').value = document.getElementById('profile-college').textContent;
        document.getElementById('edit-major').value = document.getElementById('profile-major').textContent;

        // 显示模态框
        editModal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    });

    function hideModal() {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            editModal.classList.add('hidden');
        }, 300);
    }

    closeModal.addEventListener('click', hideModal);
    cancelEdit.addEventListener('click', hideModal);

    // 保存修改
    const saveEdit = document.getElementById('save-edit');
    saveEdit.addEventListener('click', function() {
        // 获取表单数据
        const formData = {
            name: document.getElementById('edit-name').value,
            gender: document.getElementById('edit-gender').value,
            age: parseInt(document.getElementById('edit-age').value),
            college: document.getElementById('edit-college').value,
            major: document.getElementById('edit-major').value
        };

        // 显示加载状态
        saveEdit.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 保存中...';
        saveEdit.disabled = true;

        // 发送数据到后端
        updateUserData(formData)
            .then(() => {
                // 更新页面数据
                document.getElementById('profile-name').textContent = formData.name;
                document.getElementById('gender').textContent = formData.gender === 'M' ? '男' :
                    formData.gender === 'F' ? '女' : '其他';
                document.getElementById('age').textContent = formData.age + '岁';
                document.getElementById('profile-college').textContent = formData.college;
                document.getElementById('profile-major').textContent = formData.major;

                // 隐藏编辑模态框
                hideModal();

                // 显示成功提示
                showSuccessModal();
            })
            .catch(error => {
                alert('保存失败: ' + error.message);
            })
            .finally(() => {
                // 恢复按钮状态
                saveEdit.innerHTML = '<i class="fa fa-save mr-2"></i> 保存修改';
                saveEdit.disabled = false;
            });
    });

    // 隐私设置按钮点击事件
    const editPrivacyBtn = document.getElementById('edit-privacy-btn');
    let privacyModal = null;
    function showPrivacyModal(){
        privacyModal = document.getElementById('privacy-modal');
        privacyModal.classList.remove('hidden');
        setTimeout(() => {
            privacyContent.classList.remove('scale-95', 'opacity-0');
            privacyContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
    const privacyContent = document.getElementById('privacy-content');
    const closePrivacy = document.getElementById('close-privacy');
    const cancelPrivacy = document.getElementById('cancel-privacy');

    editPrivacyBtn.addEventListener('click', function() {
        // 填充表单数据
        document.getElementById('edit-phone').value = document.getElementById('phone').textContent;
        document.getElementById('edit-email').value = document.getElementById('email').textContent;

        // 显示模态框
        privacyModal.classList.remove('hidden');
        setTimeout(() => {
            privacyContent.classList.remove('scale-95', 'opacity-0');
            privacyContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    });

    function hidePrivacyModal() {
        privacyContent.classList.remove('scale-100', 'opacity-100');
        privacyContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            privacyModal.classList.add('hidden');
        }, 300);
    }

    closePrivacy.addEventListener('click', hidePrivacyModal);
    cancelPrivacy.addEventListener('click', hidePrivacyModal);

    document.getElementById('edit-privacy-btn').addEventListener('click', async function () {
        const email = document.getElementById('email').textContent.trim(); // 当前用户邮箱
        if (!email) {
            alert('未找到用户邮箱，请刷新页面后重试');
            return;
        }

        try {
            // 发送验证码请求
            const res = await fetch(API.SEND_CODE + `${encodeURIComponent(email)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + localStorage.getItem('Token'),
                }
            });

            const result = await res.json();

            if (!res.ok || result.code !== 1) {
                throw new Error(result.msg || '验证码发送失败');
            }

            alert('验证码已发送至您的邮箱，请填写验证码后提交');

            showPrivacyModal();

        } catch (error) {
            console.error('验证码发送失败:', error);
            alert('发送验证码失败，请稍后再试');
        }
    });



    // 保存隐私设置
    const savePrivacy = document.getElementById('save-privacy');
    savePrivacy.addEventListener('click', function () {
        const phone = document.getElementById('edit-phone').value.trim();
        const email = document.getElementById('edit-email').value.trim();
        const password = document.getElementById('new-password').value.trim();
        const confirmPassword = document.getElementById('confirm-password').value.trim();
        const code = document.getElementById('verify-code').value.trim();

        // 校验
        if (!phone || !email || !password || !confirmPassword || !code) {
            alert('所有字段均为必填，请检查输入');
            return;
        }

        if (password !== confirmPassword) {
            alert('两次输入的密码不一致');
            return;
        }

        const formData = {
            code,
            phone,
            email,
            password
        };

        // 显示加载状态
        savePrivacy.innerHTML = '<i class="fa fa-spinner fa-spin mr-2"></i> 保存中...';
        savePrivacy.disabled = true;

        // 提交请求
        updatePrivacyData(formData)
            .then(() => {
                // 更新界面数据
                document.getElementById('phone').textContent = phone;
                document.getElementById('email').textContent = email;

                // 隐藏模态框并清空密码
                hidePrivacyModal();
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                document.getElementById('verify-code').value = '';

                showSuccessModal();
            })
            .catch(error => {
                alert('保存失败: ' + error.message);
            })
            .finally(() => {
                savePrivacy.innerHTML = '<i class="fa fa-save mr-2"></i> 保存修改';
                savePrivacy.disabled = false;
            });
    });


    // 关闭成功提示
    document.getElementById('close-success').addEventListener('click', function() {
        const successModal = document.getElementById('success-modal');
        const successContent = document.getElementById('success-content');
        successContent.classList.remove('scale-100', 'opacity-100');
        successContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            successModal.classList.add('hidden');
        }, 300);
    });

    // 显示成功提示
    function showSuccessModal() {
        const successModal = document.getElementById('success-modal');
        const successContent = document.getElementById('success-content');
        successModal.classList.remove('hidden');
        setTimeout(() => {
            successContent.classList.remove('scale-95', 'opacity-0');
            successContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    }

    // 重试按钮点击事件
    const retryButton = document.getElementById('retry-button');
    retryButton.addEventListener('click', function() {
        document.getElementById('error-state').classList.add('hidden');
        document.getElementById('loading-state').classList.remove('hidden');
        fetchUserData();
    });

    //成绩卡片
    document.getElementById("grade-query").addEventListener("click", async function (e) {
        e.preventDefault();

        try {
            const response = await fetch(API.COURSE_GRADE, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + localStorage.getItem("Token")
                }
            });

            const result = await response.json();

            if (result.code === 1 && result.data) {
                document.getElementById("usual-score").textContent = result.data.Usual;
                document.getElementById("final-score").textContent = result.data.Final;

                document.getElementById("grade-popup").classList.remove("hidden");
            } else {
                alert("获取成绩失败！");
            }
        } catch (error) {
            console.error("请求失败:", error);
            alert("请求出错！");
        }
    });


// 关闭按钮事件
    document.getElementById("close-popup").addEventListener("click", function () {
        document.getElementById("grade-popup").classList.add("hidden");
    });
});

const token = sessionStorage.getItem('Token');
const userId = sessionStorage.getItem('userId');

async function fetchUserData() {
    const token = localStorage.getItem('Token');
    try {
        const response = await fetch(API.MYSELF, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // 渲染数据到页面
        renderUserData(data);

        // 隐藏加载状态，显示内容
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('content-area').classList.remove('hidden');
    } catch (error) {
        console.error('获取用户数据失败:', error);
        // 隐藏加载状态，显示错误状态
        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('error-state').classList.remove('hidden');
    }
}


// 更新用户基本资料
async function updateUserData(data) {
    const token = localStorage.getItem('Token');
    try {
        const response = await fetch(API.MYSELF_UPDATE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.code !== 1) {
            throw new Error(result.msg || '更新失败');
        }

        return result;
    } catch (error) {
        console.error('更新用户数据失败:', error);
        throw error;
    }
}


async function updatePrivacyData(data) {
    const token = localStorage.getItem('Token');
    try {
        const response = await fetch(API.UPDATE_CODE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token,
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.code !== 1) {
            throw new Error(result.msg || '更新失败');
        }

        return result;
    } catch (error) {
        console.error('更新隐私信息失败:', error);
        throw error;
    }
}



// 渲染用户数据到页面
function renderUserData(data) {
    if (!data || !data.data) return;

    const user = data.data;

    // 更新页面元素
    document.getElementById('student-number').textContent = user.studentNumber;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('gender').textContent = user.gender === 'M' ? '男' : '女';
    document.getElementById('age').textContent = user.age + '岁';
    document.getElementById('profile-college').textContent = user.college;
    document.getElementById('profile-major').textContent = user.major;
    document.getElementById('phone').textContent = user.phone;
    document.getElementById('email').textContent = user.email;
    document.getElementById('enrollment-date').textContent = '2021年9月'; // 入学年份从学号推断
}

window.addEventListener('storage', function(e) {
    if (e.key === 'activeUserId') {
        // 其它标签页切换了用户，这里可以刷新页面或弹出提示
        window.location.reload();
    }
});


