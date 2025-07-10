

// 随机图片绑定（确保课程图片稳定）
function PersistentRandomImage(courseId) {
    const storageKey = 'courseImageMap';
    const imgCount = 8;
    const key = String(courseId);

    let imageMap = {};
    const storedMap = localStorage.getItem(storageKey);
    if (storedMap) {
        try {
            imageMap = JSON.parse(storedMap);
        } catch (e) {
            imageMap = {};
        }
    }

    if (imageMap[key]) {
        return `/大雅之堂/Web/assets/course${imageMap[key]}.png`;
    }

    const randomIndex = Math.floor(Math.random() * imgCount) + 1;
    imageMap[key] = randomIndex;
    localStorage.setItem(storageKey, JSON.stringify(imageMap));

    return `/大雅之堂/Web/assets/course${randomIndex}.png`;
}

// ==================== 发现页模块 =====================
let discoverInitialized = false;

function initDiscoverTab() {
    if (discoverInitialized) return;
    discoverInitialized = true;

    const token = localStorage.getItem('Token');
    if (!token) return;

    const container = document.querySelector('.feature-section-2 .container .row');
    const parent = container.parentElement;

    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    let totalItems = 0;
    let currentKeyword = '';

    if (!document.getElementById('discoverSearchInput')) {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'd-flex justify-content-end mb-3';
        searchWrapper.innerHTML = `
            <input type="text" class="form-control form-control-sm w-25 me-2" placeholder="搜索课程" id="discoverSearchInput">
            <button class="btn btn-primary btn-sm" id="discoverSearchBtn">查询</button>
        `;
        parent.insertBefore(searchWrapper, container);

        document.getElementById('discoverSearchBtn').addEventListener('click', () => {
            currentKeyword = document.getElementById('discoverSearchInput').value.trim();
            currentPage = 1;
            fetchAndRender();
        });
        document.getElementById('discoverSearchInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                document.getElementById('discoverSearchBtn').click();
            }
        });
    }

    let paginationWrapper = parent.querySelector('.discover-pagination');
    if (!paginationWrapper) {
        paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'd-flex justify-content-end mt-3 discover-pagination';
        parent.appendChild(paginationWrapper);
    }

    async function fetchAndRender() {
        container.innerHTML = '';
        try {
            const res = await fetch(API.COURSE_LIST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    pageNo: currentPage,
                    pageSize: ITEMS_PER_PAGE,
                    name: currentKeyword || undefined
                })
            });

            const result = await res.json();
            if (result.code === 1 && result.data) {
                const { total, records } = result.data;
                totalItems = total;

                if (records.length === 0) {
                    container.innerHTML = `<p class="text-muted font-bond">未找到相关课程</p>`;
                } else {
                    renderCourses(records);
                }

                renderPagination();
            } else {
                container.innerHTML = `<p class="text-danger">加载课程失败</p>`;
            }
        } catch (err) {
            console.error('获取课程失败:', err);
            container.innerHTML = `<p class="text-danger">获取课程失败</p>`;
        }
    }

    function renderPagination() {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        paginationWrapper.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary btn-sm me-2';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            if (currentPage > 1) {
                currentPage--;
                fetchAndRender();
            }
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary btn-sm ms-2';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchAndRender();
            }
        };

        const info = document.createElement('span');
        info.className = 'align-self-center';
        info.textContent = `第 ${currentPage} / ${totalPages || 1} 页`;

        paginationWrapper.appendChild(prevBtn);
        paginationWrapper.appendChild(info);
        paginationWrapper.appendChild(nextBtn);
    }

    function renderCourses(records) {
        records.forEach(course => {
            const imgSrc = PersistentRandomImage(course.id);

            const card = document.createElement('div');
            card.className = 'col-md-3 mb-4';
            card.innerHTML = `
                <div class="feature-card h-100 shadow-sm position-relative" style="aspect-ratio: 1/1; cursor:pointer;"
                    data-id="${course.id}" data-img="${imgSrc}" data-teacherId="${course.teacherId}">
                    <div class="position-relative" style="height: 50%; overflow: hidden;">
                        <img src="${imgSrc}" class="w-100 h-100 object-fit-cover" alt="课程图片">
                        <div class="position-absolute bottom-0 start-0 w-100 px-2 py-1 bg-dark bg-opacity-50 text-white small text-center">
                            ${course.semester} | ${course.courseCode}
                        </div>
                    </div>
                    <div class="d-flex flex-column justify-content-between p-3 card-body-custom" style="height: 50%;">
                        <h5 class="text-center text-truncate mb-1">${course.courseName}</h5>
                        <p class="text-muted text-center small mb-1">学院：${course.college}</p>
                        <p class="text-muted text-center small mb-2">${course.teacherName}</p>
                        <div class="d-flex justify-content-between text-muted small px-2">
                            <span><i class="bi bi-clock"></i> ${course.totalHours || 0} 学时</span>
                            <span><i class="bi bi-award"></i> ${course.credit || 0} 学分</span>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector('.feature-card').addEventListener('click', async function () {
                const courseId = this.getAttribute("data-id");
                const imgSrc = this.getAttribute('data-img');
                const teacherId = this.getAttribute("data-teacherId");
                const encodedImg = encodeURIComponent(imgSrc);

                try {
                    const res = await fetch(API.JOIN_COURSE + courseId, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token
                        }
                    });

                    const result = await res.json();
                    if (result.code === 1) {
                        alert('加入成功！');
                    } else {
                        alert('加入失败：' + (result.msg || '你可能已经加入该课程'));
                    }
                } catch (err) {
                    console.error('加入课程失败:', err);
                    alert('服务器错误，加入课程失败');
                }
            });

            container.appendChild(card);
        });
    }

    fetchAndRender();
}

let myCourseInitialized = false;

function initMyCourseTab() {
    if (myCourseInitialized) return;
    myCourseInitialized = true;

    const token = localStorage.getItem('Token');
    if (!token) return;

    const container = document.querySelector('.feature-section-1 .container .row');
    const parent = container.parentElement;

    const ITEMS_PER_PAGE = 8;
    let currentPage = 1;
    let totalItems = 0;
    let currentKeyword = '';

    // 搜索框
    if (!document.getElementById('myCourseSearchInput')) {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'd-flex justify-content-end mb-3';
        searchWrapper.innerHTML = `
            <input type="text" class="form-control form-control-sm w-25 me-2" placeholder="搜索课程" id="myCourseSearchInput">
            <button class="btn btn-primary btn-sm" id="myCourseSearchBtn">查询</button>
        `;
        parent.insertBefore(searchWrapper, container);

        document.getElementById('myCourseSearchBtn').addEventListener('click', () => {
            currentKeyword = document.getElementById('myCourseSearchInput').value.trim();
            currentPage = 1;
            fetchAndRender();
        });
        document.getElementById('myCourseSearchInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                document.getElementById('myCourseSearchBtn').click();
            }
        });
    }

    let paginationWrapper = parent.querySelector('.mycourse-pagination');
    if (!paginationWrapper) {
        paginationWrapper = document.createElement('div');
        paginationWrapper.className = 'd-flex justify-content-end mt-3 mycourse-pagination';
        parent.appendChild(paginationWrapper);
    }

    async function fetchAndRender() {
        container.innerHTML = '';
        try {
            const res = await fetch(API.COURSE_LIST, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    pageNo: currentPage,
                    pageSize: ITEMS_PER_PAGE,
                    name: currentKeyword || undefined,
                    ifPerson: true // ✅ 关键字段：仅查“我加入的课程”
                })
            });

            const result = await res.json();
            if (result.code === 1 && result.data) {
                const { total, records } = result.data;
                totalItems = total;

                if (records.length === 0) {
                    container.innerHTML = `<p class="text-muted font-bond">暂无课程</p>`;
                } else {
                    renderCourses(records);
                }

                renderPagination();
            } else {
                container.innerHTML = `<p class="text-danger">加载课程失败</p>`;
            }
        } catch (err) {
            console.error('获取我的课程失败:', err);
            container.innerHTML = `<p class="text-danger">获取课程失败</p>`;
        }
    }

    function renderPagination() {
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        paginationWrapper.innerHTML = '';

        const prevBtn = document.createElement('button');
        prevBtn.className = 'btn btn-outline-primary btn-sm me-2';
        prevBtn.textContent = '上一页';
        prevBtn.disabled = currentPage === 1;
        prevBtn.onclick = () => {
            currentPage--;
            fetchAndRender();
        };

        const nextBtn = document.createElement('button');
        nextBtn.className = 'btn btn-outline-primary btn-sm ms-2';
        nextBtn.textContent = '下一页';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.onclick = () => {
            currentPage++;
            fetchAndRender();
        };

        const info = document.createElement('span');
        info.className = 'align-self-center';
        info.textContent = `第 ${currentPage} / ${totalPages || 1} 页`;

        paginationWrapper.appendChild(prevBtn);
        paginationWrapper.appendChild(info);
        paginationWrapper.appendChild(nextBtn);
    }

    function renderCourses(records) {
        records.forEach(course => {
            const imgSrc = PersistentRandomImage(course.id);
            const card = document.createElement('div');
            card.className = 'col-md-3 mb-4';

            card.innerHTML = `
                <div class="feature-card h-100 shadow-sm position-relative" style="aspect-ratio: 1/1; cursor:pointer;"
                    data-id="${course.id}" data-img="${imgSrc}" data-teacherId="${course.teacherId}">
                    <div class="position-relative" style="height: 50%; overflow: hidden;">
                        <img src="${imgSrc}" class="w-100 h-100 object-fit-cover" alt="课程图片">
                        <div class="position-absolute bottom-0 start-0 w-100 px-2 py-1 bg-dark bg-opacity-50 text-white small text-center">
                            ${course.semester} | ${course.courseCode}
                        </div>
                    </div>
                    <div class="d-flex flex-column justify-content-between p-3 card-body-custom" style="height: 50%;">
                        <h5 class="text-center text-truncate mb-1">${course.courseName}</h5>
                        <p class="text-muted text-center small mb-1">学院：${course.college}</p>
                        <p class="text-muted text-center small mb-2">${course.teacherName}</p>
                        <div class="d-flex justify-content-between text-muted small px-2">
                            <span><i class="bi bi-clock"></i> ${course.totalHours || 0} 学时</span>
                            <span><i class="bi bi-award"></i> ${course.credit || 0} 学分</span>
                        </div>
                    </div>
                </div>
            `;

            card.querySelector('.feature-card').addEventListener('click', function () {
                const courseId = this.getAttribute("data-id");
                const imgSrc = this.getAttribute('data-img');
                const teacherId = this.getAttribute("data-teacherId");
                const encodedImg = encodeURIComponent(imgSrc);
                window.location.href = `/大雅之堂/Web/html/course.html?courseId=${courseId}&teacherId=${teacherId}&img=${encodedImg}`;
            });

            container.appendChild(card);
        });
    }

    fetchAndRender();
}


// ==================== 标签切换与 hash 路由 =====================
function openTab(evt, tabName, url, title) {
    const tabs = document.getElementsByClassName("tab");
    const tabcontents = document.getElementsByClassName("tabcontent");

    for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
    }
    for (let i = 0; i < tabcontents.length; i++) {
        tabcontents[i].style.display = "none";
    }

    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");

    location.hash = url;
    document.title = title;

    if (tabName === '发现') {
        initDiscoverTab();
    }
    if (tabName === '我的课程') {
        initMyCourseTab();
    }

}

function handleHashChange() {
    const hashPath = location.hash.slice(1);
    const tabMap = {
        '/home': { tabName: '首页', title: '首页' },
        '/mycourse': { tabName: '我的课程', title: '我的课程' },
        '/center': { tabName: '发现', title: '发现' }
    };

    const target = tabMap[hashPath];
    if (target) {
        const tabBtn = [...document.getElementsByClassName('tab')]
            .find(el => el.textContent.trim() === target.tabName);
        if (tabBtn) {
            openTab({ currentTarget: tabBtn }, target.tabName, hashPath, target.title);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (!location.hash) location.hash = '/home';
    handleHashChange();
});

// ==================== 首页/全局模块逻辑 =====================
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('Token');

    // 获取课程数量
    try {
        const res = await fetch(API.COURSE_NUMBER, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const result = await res.json();
        if (result.code === 1) {
            const statNumbers = document.querySelectorAll('.stat-number');
            if (statNumbers.length > 0) {
                statNumbers[0].textContent = result.data;
            }
        }
    } catch (e) {
        console.error('获取课程数量失败', e);
    }

    // 获取学生基本信息
    const nameEl = document.querySelector('.info .name');
    const collegeEl = document.querySelector('.info .college');
    const majorEl = document.querySelector('.major');

    if (nameEl && collegeEl && majorEl) {
        try {
            const res = await fetch(API.COURSE_TITLE, {
                headers: { 'Authorization': 'Bearer ' + token }
            });

            const result = await res.json();
            if (result.code === 1 && result.data) {
                nameEl.textContent = result.data.name || '';
                collegeEl.textContent = result.data.college || '';
                majorEl.textContent = result.data.major || '';

                localStorage.setItem('id', result.data.id);
                localStorage.setItem('studentInfo', JSON.stringify(result.data));
                console.log('已写入 studentInfo 到 localStorage:', result.data);
            } else {
                console.warn('获取学生信息失败：', result);
            }
        } catch (e) {
            console.error('获取学生信息失败:', e);
        }
    }

    // 登出功能
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('Token');
            window.location.href = 'log.html';
        });
    }

    // 轮播图逻辑
    const slides = document.getElementById("slides");
    const dots = document.querySelectorAll('.dot');
    const totalSlides = dots.length;
    let currentIndex = 0;
    let interval = setInterval(nextSlide, 3000);

    function nextSlide() {
        const next = (currentIndex + 1) % totalSlides;
        showSlide(next);
    }

    function prevSlide() {
        const prev = (currentIndex - 1 + totalSlides) % totalSlides;
        showSlide(prev);
    }

    function showSlide(index) {
        slides.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle("active", i === index);
        });
        currentIndex = index;
    }

    function resetInterval() {
        clearInterval(interval);
        interval = setInterval(nextSlide, 3000);
    }

    document.querySelector(".next").addEventListener("click", () => {
        nextSlide();
        resetInterval();
    });
    document.querySelector(".prev").addEventListener("click", () => {
        prevSlide();
        resetInterval();
    });
    dots.forEach((dot, i) => {
        dot.addEventListener("click", () => {
            showSlide(i);
            resetInterval();
        });
    });
});
