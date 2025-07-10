const Params = new URLSearchParams(window.location.search);
const imgSrc = decodeURIComponent(Params.get('img')); 
const courseImage = document.getElementById('course-image');
const courseId = Params.get('courseId');
const teacherId=Params.get('teacherId');

if (imgSrc) {
    courseImage.src = imgSrc;
} else {
    courseImage.src = '../assets/default.png';
}



// 动态内容
const sections = {
    content: `
        <div class="content">
           <h1 class="title">课程目录</h1>
           <div id="file-list" class="mt-6 space-y-4"></div>
        </div>
    `,
    tasks: `
        <div class="task-list">
            <div class="task-list">
            <h2 class="text-lg font-bold text-neutral-800">作业任务</h2>
            <div id="task-list-content" class="mt-4"></div>
        </div>
        </div>
    `,
    agents: `
        <h1 class="agents">课程工具 Agent</h1>
        <p>这里是 Agent 工具板块。</p>
    `,
    groups: `
        <div class="group-section space-y-4">
          <div class="flex justify-between items-center mb-4">
            <h1 class="text-xl font-bold text-neutral-800">课程分组</h1>
            <button id="create-group-btn" class="bg-primary text-white px-4 py-2 rounded hover:bg-primary-600 transition">创建小组</button>
          </div>
        <div id="group-list" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
    </div>
    `,
    overview: `
        <h1 class="overview">课程概况</h1>
        <p>这里是课程的概况信息。</p>
    `,
    logs: `
        <h1 class="logs">公告与日志</h1>
        <p>这里是课程公告与日志。</p>
    `
};

function hideTaskModal() {
    const modal = document.getElementById('task-detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}


// 初始化
document.addEventListener('DOMContentLoaded', function () {
    const navItems = document.querySelectorAll('.nav-item');
    const contentPage = document.getElementById('page-content');

    const storedStudent = JSON.parse(localStorage.getItem('studentInfo') || 'null');
    let studentBasisDTOS;

    if (storedStudent) {
        studentBasisDTOS = [storedStudent];
    } else {
        console.warn('未找到本地学生信息，请先登录或刷新首页加载数据。');
    }

    function loadCourseFiles() {
        fetch(API.COURSE_FILE + `${teacherId}/${courseId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('Token')
            }
        })
            .then(response => response.json())
            .then(result => {
                const fileListContainer = document.getElementById('file-list');
                fileListContainer.innerHTML = '';
                if (result.code === 1) {
                    result.data.forEach(file => {
                        const item = document.createElement('div');
                        item.className = 'file-item';

                        const sizeKB = (file.size / 1024).toFixed(1) + ' KB';
                        const uploadDate = new Date(file.uploadTime).toLocaleDateString();

                        item.innerHTML = `
                            <div class="flex items-center">
                                <span class="file-icon">
                                    <i class="fa fa-file-text-o"></i>
                                </span>
                                <span>${file.name}</span>
                            </div>
                            <div class="text-gray-500 text-sm">${sizeKB}｜${uploadDate}</div>
                        `;
                        fileListContainer.appendChild(item);
                    });
                } else {
                    fileListContainer.innerHTML = '<div class="text-danger">获取文件列表失败</div>';
                }
            })
            .catch(error => {
                const fileListContainer = document.getElementById('file-list');
                fileListContainer.innerHTML = '<div class="text-danger">请求错误，无法获取文件列表</div>';
                console.error('请求错误：', error);
            });
    }

    async function loadCourseTasks(courseId) {
        const token = localStorage.getItem('Token');
        const container = document.getElementById('task-list-content');
        if (!container) return;

        container.innerHTML = '<div class="text-secondary">加载中...</div>';

        try {
            const res = await fetch(API.COURSE_TASK + `${courseId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await res.json();

            if (result.code === 1 && Array.isArray(result.data)) {
                renderTaskTable(result.data);
            } else {
                container.innerHTML = '<div class="text-neutral-500">暂无任务数据</div>';
            }
        } catch (e) {
            container.innerHTML = '<div class="text-danger">加载失败</div>';
            console.error('任务加载失败', e);
        }
    }


    let taskList = [];
    let currentPage = 1;
    const pageSize = 5;

    function renderTaskTable(data) {
        taskList = data;
        currentPage = 1;
        updateTaskPagination();
    }

    function showTaskModal(task) {
        const modal = document.getElementById('task-detail-modal');
        const content = document.getElementById('task-modal-content');
        content.innerHTML = `
        <div><strong>标题：</strong>${task.taskTitle}</div>
        <div><strong>描述：</strong>${task.taskDescription || '无'}</div>
        <div><strong>类型：</strong>${['作业','实验','项目','测验'][task.taskType]}</div>
        <div><strong>开始时间：</strong>${formatDate(task.assignedDate)}</div>
        <div><strong>截止时间：</strong>${formatDate(task.dueDate)}</div>
        <div><strong>状态：</strong>${['未开始','进行中','已完成','已过期'][task.status]}</div>
        <div><strong>备注：</strong>${task.remarks || '无'}</div>
        <div><strong>附件：</strong> 
            ${task.attachmentUrl ? `<a href="${task.attachmentUrl}" class="text-[#165DFF] underline" target="_blank">点击查看</a>` : '无'}
        </div>
    `;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }




    function updateTaskPagination() {
        const container = document.getElementById('task-list-content');
        const totalPages = Math.ceil(taskList.length / pageSize);
        const pagedTasks = taskList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

        if (pagedTasks.length === 0) {
            container.innerHTML = '<div class="text-neutral-400">暂无任务</div>';
            return;
        }

        const statusMap = ['未开始', '进行中', '已完成', '已过期'];
        const typeMap = ['作业', '实验', '项目', '测验'];

        container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full border border-neutral-200 rounded">
                <thead class="bg-neutral-100 text-sm text-neutral-600">
                    <tr>
                        <th class="p-2 text-left">任务标题</th>
                        <th class="p-2 text-left">类型</th>
                        <th class="p-2 text-left">发布时间</th>
                        <th class="p-2 text-left">截止时间</th>
                        <th class="p-2 text-left">状态</th>
                        <th class="p-2 text-center">操作</th>
                    </tr>
                </thead>
                <tbody class="text-sm text-neutral-700">
                    ${pagedTasks.map(task => `
                        <tr class="border-t border-neutral-200 hover:bg-neutral-50 transition">
                            <td class="p-2">${task.taskTitle}</td>
                            <td class="p-2">${typeMap[task.taskType] || '未知'}</td>
                            <td class="p-2">${formatDate(task.assignedDate)}</td>
                            <td class="p-2">${formatDate(task.dueDate)}</td>
                            <td class="p-2">
                                <span class="px-2 py-1 rounded-full text-xs font-medium ${statusBadge(task.status)}">
                                    ${statusMap[task.status] || '未知'}
                                </span>
                            </td>
                            <td class="p-2 text-center">
                                <button class="text-primary hover:underline view-task-detail" data-id="${task.id}">
                                    查看任务
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <div class="flex justify-between items-center mt-4 text-sm text-neutral-600">
            <div>共 ${taskList.length} 条作业</div>
            <div class="space-x-2">
                <button ${currentPage === 1 ? 'disabled' : ''} class="px-2 py-1 border rounded prev-task-btn">上一页</button>
                <span>第 ${currentPage} 页 / 共 ${totalPages} 页</span>
                <button ${currentPage === totalPages ? 'disabled' : ''} class="px-2 py-1 border rounded next-task-btn">下一页</button>
            </div>
        </div>
    `;

        container.querySelectorAll('.view-task-detail').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const task = taskList.find(t => String(t.id) === id);
                showTaskModal(task);
            });
        });

        container.querySelector('.prev-task-btn')?.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updateTaskPagination();
            }
        });

        container.querySelector('.next-task-btn')?.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updateTaskPagination();
            }
        });
    }

    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleString();
    }

    function statusBadge(status) {
        return [
            'bg-neutral-100 text-neutral-500',
            'bg-[#165DFF1A] text-primary',
            'bg-success/10 text-success',
            'bg-danger/10 text-danger'
        ][status] || 'bg-neutral-100 text-neutral-500';
    }

    async function checkInGroupStatus() {
        const token = localStorage.getItem('Token');
        const userId = localStorage.getItem('id');
        if (!token || !userId || !courseId) return;

        try {
            const res = await fetch(API.GAT_IN_GROUP+`${courseId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                }
            });
            const result = await res.json();

            if (result.code === 1 && result.data?.isInGroup && result.data.groupId) {
                const groupId = String(result.data.groupId);
                localStorage.setItem(`joinedGroupId_${userId}_${courseId}`, groupId);
                updateJoinButtons(groupId);
            }
        } catch (err) {
            console.error('获取组内状态失败：', err);
        }
    }


    document.getElementById('create-group-btn')?.addEventListener('click', () => {
        document.getElementById('group-create-modal').classList.remove('hidden');
    });

    document.getElementById('cancel-create-group')?.addEventListener('click', () => {
        document.getElementById('group-create-modal').classList.add('hidden');
    });

    document.getElementById('confirm-create-group')?.addEventListener('click', async () => {
        const name = document.getElementById('group-name').value.trim();
        const desc = document.getElementById('group-desc').value.trim();

        if (!name) {
            alert('请输入小组名称');
            return;
        }

        try {
            const token = localStorage.getItem('Token');
            const userId = localStorage.getItem('id');
            const body = {
                courseId: Number(courseId),
                groupName: name,
                groupDescription: desc,
                id: Number(userId),
                studentBasisDTOS: studentBasisDTOS
            };

            const res = await fetch(API.ADD_GROUP, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(body)
            });

            const result = await res.json();
            if (result.code === 1) {
                alert('创建成功');
                document.getElementById('group-create-modal').classList.add('hidden');
                loadCourseGroups(courseId); // 重新加载小组
                checkInGroupStatus();
            } else {
                alert('创建失败：' + '请稍后重试');
            }
        } catch (err) {
            console.error('创建失败', err);
            alert('请求错误，无法创建小组');
        }
    });



    function loadCourseGroups(courseId) {
        const token = localStorage.getItem('Token');
        const container = document.getElementById('group-list');
        container.innerHTML = '<div class="text-secondary">加载中...</div>';

        fetch(API.GROUP_LIST + `${courseId}`, {
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
            .then(res => res.json())
            .then(result => {
                if (result.code === 1 && Array.isArray(result.data)) {
                    renderGroupCards(result.data);
                    const userId = localStorage.getItem('id');
                    const joinedGroupId = localStorage.getItem(`joinedGroupId_${userId}_${courseId}`);
                    if (joinedGroupId) updateJoinButtons(joinedGroupId); // 刷新状态
                    checkInGroupStatus();
                } else {
                    container.innerHTML = '<div class="text-danger">暂无小组</div>';
                }
            })
            .catch(err => {
                console.error('获取小组失败', err);
                container.innerHTML = '<div class="text-danger">请求失败</div>';
            });

    }

    function renderGroupCards(groups) {
        const container = document.getElementById('group-list');
        container.innerHTML = '';
        const userId = localStorage.getItem('id');
        const joinedGroupId = localStorage.getItem(`joinedGroupId_${userId}_${courseId}`);

        groups.forEach(group => {
            const isJoined = joinedGroupId === String(group.id);
            const isDisabled = joinedGroupId && joinedGroupId !== String(group.id);

            const card = document.createElement('div');
            card.className = `
           bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md 
           transition-all duration-200 p-5 flex flex-col
           w-full max-w-xs overflow-hidden
           hover:border-neutral-300 hover:-translate-y-0.5
           group/card 
        `;

            card.innerHTML = `
    <div class="space-y-3">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 
                      flex items-center justify-center text-primary-600">
                ${group.icon || '👥'}
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 line-clamp-1">
                ${group.groupName}
            </h3>
        </div>
        
        <p class="text-sm text-neutral-500 line-clamp-2 leading-relaxed">
            ${group.groupDescription || '暂无描述'}
        </p>
    </div>

    <button 
        class="join-group-btn mt-4 px-4 py-2 text-sm rounded-lg 
               ${isJoined ? 'bg-neutral-400 cursor-not-allowed' : isDisabled ? 'bg-neutral-200 cursor-not-allowed' : 'bg-primary hover:bg-primary-600'} 
               text-white transition-all shadow-sm hover:shadow-md
               focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
               group-hover/card:shadow-md"
        data-id="${group.id}"
        ${isJoined || isDisabled ? 'disabled' : ''}
    >
        ${isJoined ? '已加入' : '加入小组'}
    </button>
`;

            container.appendChild(card);
        });

        container.querySelectorAll('.join-group-btn').forEach(button => {
            button.addEventListener('click', () => {
                const groupId = button.getAttribute('data-id');
                if (button.disabled) return;
                // remark直接传空字符串
                joinGroup(groupId, '', button);
            });
        });
    }



    function joinGroup(groupId, remark, button) {
        const token = localStorage.getItem('Token');
        const userId = localStorage.getItem('id');

        fetch(API.GROUP_IN + `${groupId}&remark=${encodeURIComponent(remark)}`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'Authorization': 'Bearer ' + token
            }
        })
            .then(res => res.json())
            .then(result => {
                if (result.code === 1) {
                    alert('加入成功！');
                    localStorage.setItem(`joinedGroupId_${userId}_${courseId}`, groupId); // 只保存当前用户的
                    updateJoinButtons(groupId); // 更新按钮状态
                } else {
                    alert('加入失败：' + (result.msg || '请稍后重试'));
                }
            })
            .catch(err => {
                console.error('加入失败', err);
                alert('请求错误，无法加入小组');
            });
    }

    function updateJoinButtons(joinedId) {
        const userId = localStorage.getItem('id');
        const buttons = document.querySelectorAll('.join-group-btn');
        buttons.forEach(btn => {
            const id = btn.getAttribute('data-id');
            // 只禁用当前用户已加入的小组，其他按钮可用
            if (id === joinedId) {
                btn.disabled = true;
                btn.innerText = '已加入';
                btn.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-primary-600', 'hover:from-primary-600', 'hover:to-primary-700');
                btn.classList.add('bg-neutral-400', 'cursor-not-allowed');
            } else {
                btn.disabled = !!joinedId; // 只要有已加入小组，其他都禁用
                btn.innerText = '加入小组';
                btn.classList.remove('bg-gradient-to-r', 'from-primary-500', 'to-primary-600');
                btn.classList.add('bg-neutral-200', 'cursor-not-allowed');
            }
        });
    }





    function switchSection(sectionName) {
        contentPage.classList.remove('animate-fade-in');
        contentPage.innerHTML = sections[sectionName] || '<p class="text-gray-500">暂无内容</p>';
        setTimeout(() => contentPage.classList.add('animate-fade-in'), 10);

        if (sectionName === 'content') {
            loadCourseFiles();
        }
        if(sectionName === 'tasks') {
            loadCourseTasks(courseId);
        }
        if (sectionName === 'agents') {}
        if(sectionName === 'groups') {
            loadCourseGroups(courseId);
        }
        if(sectionName === 'overview') {}
        if(sectionName === 'logs') {}
    }

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();

            navItems.forEach(nav => nav.classList.remove('nav-active'));
            this.classList.add('nav-active');

            const sectionName = this.getAttribute('href').substring(1);
            switchSection(sectionName);
        });
    });

    switchSection('content');
});

document.addEventListener('click', function(e) {
    // 创建小组按钮
    if (e.target && e.target.id === 'create-group-btn') {
        document.getElementById('group-create-modal').classList.remove('hidden');
    }
    // 取消按钮
    if (e.target && e.target.id === 'cancel-create-group') {
        document.getElementById('group-create-modal').classList.add('hidden');
    }
});

window.addEventListener('storage', function(e) {
    if (e.key === 'activeUserId') {
        // 其它标签页切换了用户，这里可以刷新页面或弹出提示
        window.location.reload();
    }
});
